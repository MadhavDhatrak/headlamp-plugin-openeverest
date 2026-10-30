import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React, { useState } from 'react';
import { BackupStorage } from '../crd/BackupStorage';

export interface CreateBackupStorageDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultNamespace?: string;
}

export function CreateBackupStorageDialog({
  open,
  onClose,
  onCreated,
  defaultNamespace = 'default',
}: CreateBackupStorageDialogProps) {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState(defaultNamespace);
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [endpointURL, setEndpointURL] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [verifyTLS, setVerifyTLS] = useState(true);
  const [forcePathStyle, setForcePathStyle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setNamespace(defaultNamespace);
    setBucket('');
    setRegion('');
    setEndpointURL('');
    setAccessKey('');
    setSecretKey('');
    setShowAccessKey(false);
    setShowSecretKey(false);
    setVerifyTLS(true);
    setForcePathStyle(false);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const isFormValid =
    name.trim() !== '' &&
    bucket.trim() !== '' &&
    region.trim() !== '' &&
    endpointURL.trim() !== '' &&
    accessKey.trim() !== '' &&
    secretKey.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      apiVersion: 'backup.openeverest.io/v1alpha1',
      kind: 'BackupStorage',
      metadata: {
        name: name.trim(),
        namespace: namespace.trim() || 'default',
      },
      spec: {
        type: 's3',
        s3: {
          bucket: bucket.trim(),
          region: region.trim(),
          endpointURL: endpointURL.trim(),
          credentialsSecretRef: {
            name: `${name.trim()}-credentials`,
          },
          accessKeyId: accessKey.trim(),
          secretAccessKey: secretKey.trim(),
          verifyTLS,
          forcePathStyle,
        },
      },
    };

    const secretPayload = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${name.trim()}-credentials`,
        namespace: namespace.trim() || 'default',
      },
      type: 'Opaque',
      stringData: {
        AWS_ACCESS_KEY_ID: accessKey.trim(),
        AWS_SECRET_ACCESS_KEY: secretKey.trim(),
      },
    };

    try {
      try {
        await K8s.ResourceClasses.Secret.apiEndpoint.post(secretPayload);
      } catch (secErr: any) {
        if (secErr?.status !== 409) {
          console.warn('Secret creation warning:', secErr);
        }
      }
      await BackupStorage.apiEndpoint.post(payload);
      setIsSubmitting(false);
      resetForm();
      onCreated?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'Failed to create backup storage');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Backup storage
          <IconButton size="small" onClick={handleClose} disabled={isSubmitting}>
            <Icon icon="mdi:close" width={20} height={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Name"
                placeholder="Enter storage display name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Namespace"
                value={namespace}
                onChange={e => setNamespace(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="storage-type-label">Type</InputLabel>
                <Select
                  labelId="storage-type-label"
                  label="Type"
                  value="s3"
                  disabled
                >
                  <MenuItem value="s3">S3 Compatible</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Bucket Name"
                placeholder="test-open-everest"
                value={bucket}
                onChange={e => setBucket(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Region"
                placeholder="Enter region"
                value={region}
                onChange={e => setRegion(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Endpoint"
                placeholder="https://s3.amazonaws.com or http://minio:9000"
                value={endpointURL}
                onChange={e => setEndpointURL(e.target.value)}
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Access Key"
                type={showAccessKey ? 'text' : 'password'}
                value={accessKey}
                onChange={e => setAccessKey(e.target.value)}
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowAccessKey(!showAccessKey)}
                      >
                        <Icon icon={showAccessKey ? 'mdi:eye-off' : 'mdi:eye'} width={18} height={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                size="small"
                label="Secret Key"
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        <Icon icon={showSecretKey ? 'mdi:eye-off' : 'mdi:eye'} width={18} height={18} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={verifyTLS}
                      onChange={e => setVerifyTLS(e.target.checked)}
                      disabled={isSubmitting}
                      size="small"
                    />
                  }
                  label="Verify TLS certificate"
                />
                <Tooltip title="Verify SSL/TLS certificate validity when communicating with the S3 endpoint.">
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <Icon icon="mdi:information-outline" width={16} height={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={forcePathStyle}
                      onChange={e => setForcePathStyle(e.target.checked)}
                      disabled={isSubmitting}
                      size="small"
                    />
                  }
                  label="Force path-style URL access"
                />
                <Tooltip title="Force path-style URLs (endpoint/bucket) rather than virtual-hosted URLs (bucket.endpoint), recommended for MinIO.">
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <Icon icon="mdi:information-outline" width={16} height={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
