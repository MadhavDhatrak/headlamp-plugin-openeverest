import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { BackupClass } from '../crd/BackupClass';
import { BackupStorage } from '../crd/BackupStorage';
import {
  FlattenedSchedule,
  getCompatibleBackupClasses,
  parseCronDisplay,
  PitrConfigMap,
} from '../utils/backupSchedules';
import { CreateBackupStorageDialog } from './CreateBackupStorageDialog';
import { CreateScheduleModal } from './CreateScheduleModal';

export interface ScheduledBackupsStepProps {
  namespace: string;
  provider: string;
  schedules: FlattenedSchedule[];
  onSchedulesChange: (schedules: FlattenedSchedule[]) => void;
  backupClassName?: string;
  onBackupClassNameChange: (name: string) => void;
  pitrMap: PitrConfigMap;
  onPitrMapChange: (pitrMap: PitrConfigMap) => void;
  backupStorages: BackupStorage[];
  onStorageCreated?: () => void;
}

export function ScheduledBackupsStep({
  namespace,
  provider,
  schedules,
  onSchedulesChange,
  backupClassName,
  onBackupClassNameChange,
  pitrMap,
  onPitrMapChange,
  backupStorages,
  onStorageCreated,
}: ScheduledBackupsStepProps) {
  const [backupClasses] = BackupClass.useList();
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<FlattenedSchedule | null>(null);
  const [openCreateStorageDialog, setOpenCreateStorageDialog] = useState(false);

  // Filter BackupClasses that strictly support this database provider 
  const compatibleClasses = useMemo(() => {
    return getCompatibleBackupClasses(backupClasses || [], provider);
  }, [backupClasses, provider]);

  const activeBackupClass = useMemo(() => {
    if (backupClassName) {
      return compatibleClasses.find(bc => bc.metadata.name === backupClassName) || compatibleClasses[0];
    }
    return compatibleClasses[0];
  }, [compatibleClasses, backupClassName]);

  const handleOpenCreateModal = () => {
    setSelectedSchedule(null);
    setScheduleModalMode('create');
    setOpenScheduleModal(true);
  };

  const handleOpenEditModal = (sched: FlattenedSchedule) => {
    setSelectedSchedule(sched);
    setScheduleModalMode('edit');
    setOpenScheduleModal(true);
  };

  const handleDeleteSchedule = (schedName: string) => {
    onSchedulesChange(schedules.filter(s => s.name !== schedName));
  };

  const handleSaveSchedule = (savedSchedule: FlattenedSchedule, chosenClassName: string) => {
    if (chosenClassName && chosenClassName !== backupClassName) {
      onBackupClassNameChange(chosenClassName);
    }

    if (scheduleModalMode === 'edit' && selectedSchedule) {
      onSchedulesChange(
        schedules.map(s => (s.name === selectedSchedule.name ? savedSchedule : s))
      );
    } else {
      onSchedulesChange([...schedules, savedSchedule]);
    }
  };

  const handlePitrToggle = (storageName: string, enabled: boolean) => {
    onPitrMapChange({
      ...pitrMap,
      [storageName]: {
        ...pitrMap[storageName],
        enabled,
      },
    });
  };

  // Distinct storages configured across existing schedules
  const scheduledStorageNames = useMemo(() => {
    return Array.from(new Set(schedules.map(s => s.storageName)));
  }, [schedules]);

  const supportsPitr = activeBackupClass?.supportsPITR ?? false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Backups
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Specify the settings for scheduled backups and point-in-time recovery to enable easy rollbacks and disaster recovery.
        </Typography>
      </Box>

      {backupStorages.length === 0 ? (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={() => setOpenCreateStorageDialog(true)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add storage
            </Button>
          }
          sx={{ alignItems: 'center' }}
        >
          You don't have any backup storages configured in this namespace yet. Add a backup storage before setting up schedules.
        </Alert>
      ) : (
        <>
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Backup schedules
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Icon icon="mdi:plus" />}
                onClick={handleOpenCreateModal}
              >
                Create backup schedule
              </Button>
            </Box>

            {schedules.length === 0 ? (
              <Card variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  No backup schedules configured yet. Click "Create backup schedule" to set up regular backups.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2}>
                {schedules.map(sched => (
                  <Card key={sched.name} variant="outlined" sx={{ p: 2 }}>
                    <CardContent sx={{ p: '0 !important' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {sched.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={sched.enabled ? 'Enabled' : 'Disabled'}
                              color={sched.enabled ? 'success' : 'default'}
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, color: 'text.secondary', fontSize: '0.875rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon icon="mdi:calendar-clock-outline" width={16} />
                              <span>{parseCronDisplay(sched.cron)}</span>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon icon="mdi:database-outline" width={16} />
                              <span>Storage: <strong>{sched.storageName}</strong></span>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon icon="mdi:history" width={16} />
                              <span>
                                Retention: {sched.retentionCopies === 0 ? 'Infinite' : `${sched.retentionCopies} copies`}
                              </span>
                            </Box>

                            {sched.parameters?.type && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Icon icon="mdi:tag-outline" width={16} />
                                <span>Type: {String(sched.parameters.type).toUpperCase()}</span>
                              </Box>
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit schedule">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditModal(sched)}
                              aria-label="edit schedule"
                            >
                              <Icon icon="mdi:pencil-outline" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete schedule">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteSchedule(sched.name)}
                              aria-label="delete schedule"
                            >
                              <Icon icon="mdi:trash-can-outline" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          {supportsPitr && scheduledStorageNames.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Point-in-time recovery (PITR)
                  </Typography>
                  <Tooltip
                    title="PITR enables restoring database state to any specific second between backups by streaming write-ahead logs to storage."
                    arrow
                  >
                    <IconButton size="small" sx={{ p: 0.25 }}>
                      <Icon icon="mdi:information-outline" width={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Continuous log archiving allows recovery to an exact timestamp between full backups.
                </Typography>

                <Stack spacing={1.5}>
                  {scheduledStorageNames.map(storageName => {
                    const isPitrEnabled = Boolean(pitrMap[storageName]?.enabled);
                    return (
                      <Card key={storageName} variant="outlined" sx={{ px: 2.5, py: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {storageName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isPitrEnabled
                                ? 'Log archiving is enabled for this storage location'
                                : 'Enable PITR to allow point-in-time recovery on this storage'}
                            </Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={isPitrEnabled}
                                onChange={e => handlePitrToggle(storageName, e.target.checked)}
                                color="primary"
                              />
                            }
                            label={isPitrEnabled ? 'Enabled' : 'Disabled'}
                            sx={{ m: 0 }}
                          />
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </>
      )}

      {openScheduleModal && (
        <CreateScheduleModal
          open={openScheduleModal}
          onClose={() => setOpenScheduleModal(false)}
          onSave={handleSaveSchedule}
          mode={scheduleModalMode}
          initialScheduleData={selectedSchedule}
          existingSchedules={schedules}
          availableBackupClasses={compatibleClasses}
          selectedBackupClassName={backupClassName}
          lockBackupClass={schedules.length > 0}
          backupStorages={backupStorages}
        />
      )}

      {openCreateStorageDialog && (
        <CreateBackupStorageDialog
          open={openCreateStorageDialog}
          onClose={() => setOpenCreateStorageDialog(false)}
          onCreated={() => {
            setOpenCreateStorageDialog(false);
            onStorageCreated?.();
          }}
          defaultNamespace={namespace}
        />
      )}
    </Box>
  );
}
