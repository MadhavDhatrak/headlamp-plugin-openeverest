import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Backup } from '../crd/Backup';
import { BackupClass } from '../crd/BackupClass';
import { BackupStorage } from '../crd/BackupStorage';
import { Instance } from '../crd/Instance';
import { getCompatibleBackupClasses } from '../utils/backupSchedules';

export interface CreateOnDemandBackupDialogProps {
  open: boolean;
  onClose: () => void;
  availableInstances: Instance[];
  selectedInstanceName?: string;
  backupStorages: BackupStorage[];
  availableBackupClasses?: BackupClass[];
  onCreated?: (backupName: string) => void;
}

function generateBackupName(instanceName: string): string {
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${instanceName || 'db'}-backup-${suffix}`;
}

export function CreateOnDemandBackupDialog({
  open,
  onClose,
  availableInstances = [],
  selectedInstanceName = '',
  backupStorages = [],
  availableBackupClasses,
  onCreated,
}: CreateOnDemandBackupDialogProps) {
  const [fetchedBackupClasses] = BackupClass.useList();
  const backupClasses = availableBackupClasses || fetchedBackupClasses || [];

  const [instanceName, setInstanceName] = useState('');
  const [name, setName] = useState('');
  const [storageName, setStorageName] = useState('');
  const [backupClassName, setBackupClassName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedInstance = useMemo(() => {
    return availableInstances.find(inst => inst.metadata.name === instanceName);
  }, [availableInstances, instanceName]);

  const compatibleBackupClasses = useMemo(() => {
    return getCompatibleBackupClasses(backupClasses, selectedInstance?.providerName);
  }, [backupClasses, selectedInstance?.providerName]);

  const selectInstance = (inst: Instance | undefined | null) => {
    const instName = inst?.metadata?.name || '';
    setInstanceName(instName);
    setName(generateBackupName(instName));

    const instanceClass = inst?.spec?.backup?.classRef?.name;
    const compatible = getCompatibleBackupClasses(backupClasses, inst?.providerName);
    setBackupClassName(instanceClass || compatible[0]?.metadata?.name || '');

    const configuredStorage = inst?.spec?.backup?.storages?.[0]?.storageRef?.name;
    if (configuredStorage && backupStorages.some(s => s.metadata.name === configuredStorage)) {
      setStorageName(configuredStorage);
    } else if (backupStorages.length > 0) {
      setStorageName(backupStorages[0].metadata.name);
    } else {
      setStorageName('');
    }
  };

  useEffect(() => {
    if (!open) return;

    setError(null);
    setNameTouched(false);
    setIsSubmitting(false);

    const initial =
      (selectedInstanceName
        ? availableInstances.find(inst => inst.metadata?.name === selectedInstanceName)
        : availableInstances[0]) || null;

    selectInstance(initial);
  }, [open, selectedInstanceName, availableInstances, backupStorages, backupClasses]);

  const handleInstanceChange = (newInstanceName: string) => {
    const inst = availableInstances.find(i => i.metadata.name === newInstanceName);
    selectInstance(inst);
  };

  const nameError = useMemo(() => {
    if (!nameTouched && !name) return null;
    const trimmed = name.trim();
    if (!trimmed) return 'Backup name is required';
    if (trimmed.length > 63) return 'Backup name must not exceed 63 characters';
    const k8sDnsRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
    if (!k8sDnsRegex.test(trimmed)) {
      return 'Name must consist of lowercase alphanumeric characters or "-", and start and end with an alphanumeric character';
    }
    return null;
  }, [name, nameTouched]);

  const storageError = useMemo(() => {
    if (!storageName) return 'Please select a backup storage';
    return null;
  }, [storageName]);

  const classError = useMemo(() => {
    if (!backupClassName) {
      return selectedInstance?.providerName
        ? `No compatible BackupClass found for provider "${selectedInstance.providerName}"`
        : 'Please select a database instance with a valid BackupClass';
    }
    return null;
  }, [backupClassName, selectedInstance?.providerName]);

  const isValid = !nameError && !storageError && !classError && Boolean(backupClassName) && name.trim().length > 0 && Boolean(instanceName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const targetNamespace = selectedInstance?.metadata?.namespace || 'default';

    if (!backupClassName) {
      setError(classError || 'No compatible BackupClass found');
      setIsSubmitting(false);
      return;
    }

    const existingStorages = selectedInstance?.spec?.backup?.storages ?? [];
    const isAlreadyConfigured = existingStorages.some(
      s => s.storageRef?.name === storageName
    );

    if (!isAlreadyConfigured && selectedInstance) {
      const newStorage = {
        storageRef: { name: storageName },
      };

      const patchPayload = {
        spec: {
          backup: {
            classRef: selectedInstance.spec?.backup?.classRef ?? { name: backupClassName },
            enabled: true,
            storages: [...existingStorages, newStorage],
          },
        },
      };

      try {
        await selectedInstance.patch(patchPayload);
      } catch (patchErr: any) {
        console.warn('Could not auto-register backup storage on instance:', patchErr);
      }
    }

    const payload = {
      apiVersion: 'backup.openeverest.io/v1alpha1',
      kind: 'Backup',
      metadata: {
        name: name.trim(),
        namespace: targetNamespace,
      },
      spec: {
        origin: {
          type: 'Instance' as const,
          instanceRef: {
            name: instanceName,
          },
        },
        storageRef: {
          name: storageName,
        },
        classRef: {
          name: backupClassName,
        },
      },
    };

    try {
      await Backup.apiEndpoint.post(payload);
      setIsSubmitting(false);
      onCreated?.(name.trim());
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to create on-demand backup');
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Take On-Demand Backup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capture an immediate point-in-time snapshot of your database
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          {backupStorages.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              No backup storage is configured. Please create a Backup Storage first before taking snapshots.
            </Alert>
          )}

          {classError && (
            <Alert severity="warning" sx={{ mb: 2.5 }}>
              {classError}. Please ensure an OpenEverest BackupClass is installed before taking snapshots.
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small" required>
              <InputLabel id="ondemand-db-label">Database instance</InputLabel>
              <Select
                labelId="ondemand-db-label"
                label="Database instance"
                value={instanceName}
                onChange={e => handleInstanceChange(e.target.value)}
                disabled={isSubmitting || availableInstances.length === 0}
              >
                {availableInstances.map(inst => (
                  <MenuItem key={inst.metadata.name} value={inst.metadata.name}>
                    {inst.metadata.name} {inst.providerName ? `(${inst.providerName})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {compatibleBackupClasses.length > 1 && (
              <FormControl fullWidth size="small" required error={Boolean(classError)}>
                <InputLabel id="ondemand-class-label">Backup class</InputLabel>
                <Select
                  labelId="ondemand-class-label"
                  label="Backup class"
                  value={backupClassName}
                  onChange={e => setBackupClassName(e.target.value)}
                  disabled={isSubmitting}
                >
                  {compatibleBackupClasses.map(bc => (
                    <MenuItem key={bc.metadata.name} value={bc.metadata.name}>
                      {bc.metadata.name}
                    </MenuItem>
                  ))}
                </Select>
                {classError && <FormHelperText>{classError}</FormHelperText>}
              </FormControl>
            )}

            <TextField
              label="Backup snapshot name"
              required
              fullWidth
              size="small"
              value={name}
              disabled={isSubmitting}
              onChange={e => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              error={Boolean(nameError)}
              helperText={nameError || 'Unique name for this point-in-time snapshot'}
            />

            <FormControl fullWidth size="small" required error={Boolean(storageError)}>
              <InputLabel id="ondemand-storage-label">Backup storage</InputLabel>
              <Select
                labelId="ondemand-storage-label"
                label="Backup storage"
                value={storageName}
                onChange={e => setStorageName(e.target.value)}
                disabled={isSubmitting || backupStorages.length === 0}
              >
                {backupStorages.map(storage => (
                  <MenuItem key={storage.metadata.name} value={storage.metadata.name}>
                    {storage.metadata.name} ({storage.storageType.toUpperCase()} - {storage.bucket})
                  </MenuItem>
                ))}
              </Select>
              {storageError ? (
                <FormHelperText>{storageError}</FormHelperText>
              ) : (
                <FormHelperText>Target cloud storage location where snapshot data will be stored</FormHelperText>
              )}
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isSubmitting || backupStorages.length === 0}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Create Backup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

