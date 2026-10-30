import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { BackupClass } from '../crd/BackupClass';
import { BackupStorage } from '../crd/BackupStorage';
import {
  cronToHumanDescription,
  DAYS_OF_MONTH,
  DAYS_OF_WEEK,
  FlattenedSchedule,
  HOURS,
  MINUTES,
  parseCronToState,
  ScheduleFrequency,
  timeToCron,
} from '../utils/backupSchedules';

export interface CreateScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (schedule: FlattenedSchedule, backupClassName: string) => void;
  mode?: 'create' | 'edit';
  initialScheduleData?: FlattenedSchedule | null;
  existingSchedules?: FlattenedSchedule[];
  availableBackupClasses: BackupClass[];
  selectedBackupClassName?: string;
  lockBackupClass?: boolean;
  backupStorages: BackupStorage[];
}

export function CreateScheduleModal({
  open,
  onClose,
  onSave,
  mode = 'create',
  initialScheduleData,
  existingSchedules = [],
  availableBackupClasses = [],
  selectedBackupClassName = '',
  lockBackupClass = false,
  backupStorages = [],
}: CreateScheduleModalProps) {
  const [name, setName] = useState('');
  const [backupClassName, setBackupClassName] = useState('');
  const [storageName, setStorageName] = useState('');
  const [retentionCopies, setRetentionCopies] = useState<number>(0);
  const [frequency, setFrequency] = useState<ScheduleFrequency>('Daily');
  const [hour, setHour] = useState<number>(1);
  const [minute, setMinute] = useState<number>(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
  const [weekDay, setWeekDay] = useState<number>(1);
  const [monthDay, setMonthDay] = useState<number>(1);
  const [backupType, setBackupType] = useState<string>('full');
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!open) return;

    setNameTouched(false);

    if (mode === 'edit' && initialScheduleData) {
      setName(initialScheduleData.name);
      setStorageName(initialScheduleData.storageName);
      setRetentionCopies(initialScheduleData.retentionCopies);
      const parsed = parseCronToState(initialScheduleData.cron);
      setFrequency(parsed.frequency);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setAmpm(parsed.ampm);
      setWeekDay(parsed.weekDay);
      setMonthDay(parsed.monthDay);
      setBackupType((initialScheduleData.parameters as any)?.type || 'full');
    } else {
      setName('');
      setRetentionCopies(0);
      setFrequency('Daily');
      setHour(1);
      setMinute(0);
      setAmpm('AM');
      setWeekDay(1);
      setMonthDay(1);
      setBackupType('full');

      if (backupStorages.length > 0) {
        setStorageName(backupStorages[0].metadata.name);
      } else {
        setStorageName('');
      }
    }

    if (selectedBackupClassName) {
      setBackupClassName(selectedBackupClassName);
    } else if (availableBackupClasses.length > 0) {
      setBackupClassName(availableBackupClasses[0].metadata.name);
    } else {
      setBackupClassName('');
    }
  }, [open, mode, initialScheduleData, selectedBackupClassName, availableBackupClasses, backupStorages]);

  const usedStoragesCount = useMemo(() => {
    const usedNames = new Set(existingSchedules.map(s => s.storageName));
    if (storageName) {
      usedNames.add(storageName);
    }
    return usedNames.size;
  }, [existingSchedules, storageName]);

  const liveCron = useMemo(() => {
    return timeToCron(frequency, hour, minute, ampm, weekDay, monthDay);
  }, [frequency, hour, minute, ampm, weekDay, monthDay]);

  const liveDescription = useMemo(() => {
    return cronToHumanDescription(frequency, hour, minute, ampm, weekDay, monthDay);
  }, [frequency, hour, minute, ampm, weekDay, monthDay]);

  const nameError = useMemo(() => {
    if (!nameTouched && !name) {
      return null;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Backup name is required';
    }
    if (trimmed.length > 63) {
      return 'Backup name must not exceed 63 characters';
    }
    const k8sDnsRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
    if (!k8sDnsRegex.test(trimmed)) {
      return 'Name must consist of lower case alphanumeric characters or "-", and must start and end with an alphanumeric character';
    }
    const isDuplicate = existingSchedules.some(
      s => s.name === trimmed && (mode === 'create' || s.name !== initialScheduleData?.name)
    );
    if (isDuplicate) {
      return 'You already have a schedule with the same name.';
    }
    return null;
  }, [name, nameTouched, mode, existingSchedules, initialScheduleData]);

  const storageError = useMemo(() => {
    if (!storageName) {
      return 'Please select a backup storage';
    }
    return null;
  }, [storageName]);

  const isValid = !nameError && !storageError && name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    if (!isValid) return;

    const schedule: FlattenedSchedule = {
      name: name.trim(),
      cron: liveCron,
      enabled: initialScheduleData ? initialScheduleData.enabled : true,
      storageName,
      retentionCopies: Math.max(0, retentionCopies || 0),
      parameters: {
        type: backupType,
      },
    };

    onSave(schedule, backupClassName);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {mode === 'create' ? 'Create backup schedule' : 'Edit backup schedule'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set up regular backups to protect your database
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Backup Details
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Backup name"
              required
              fullWidth
              size="small"
              value={name}
              disabled={mode === 'edit'}
              onChange={e => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              error={Boolean(nameError)}
              helperText={nameError || undefined}
            />

            <FormControl fullWidth size="small" disabled={lockBackupClass || availableBackupClasses.length <= 1}>
              <InputLabel id="backup-class-select-label">Backup class</InputLabel>
              <Select
                labelId="backup-class-select-label"
                label="Backup class"
                value={backupClassName}
                onChange={e => setBackupClassName(e.target.value)}
              >
                {availableBackupClasses.map(bc => (
                  <MenuItem key={bc.metadata.name} value={bc.metadata.name}>
                    {bc.spec.displayName || bc.metadata.name}
                  </MenuItem>
                ))}
              </Select>
              {(lockBackupClass || availableBackupClasses.length <= 1) && (
                <FormHelperText>
                  Backup class is shared across all schedules for this instance.
                </FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth size="small" error={Boolean(storageError)}>
              <InputLabel id="backup-storage-select-label" required>
                Backup storage
              </InputLabel>
              <Select
                labelId="backup-storage-select-label"
                label="Backup storage *"
                value={storageName}
                onChange={e => setStorageName(e.target.value)}
              >
                {backupStorages.map(bs => (
                  <MenuItem key={bs.metadata.name} value={bs.metadata.name}>
                    {bs.metadata.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {storageError ||
                  `You are currently using ${usedStoragesCount} out of ${backupStorages.length} available storages`}
              </FormHelperText>
            </FormControl>

            <TextField
              label="Retention copies"
              required
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={retentionCopies}
              onChange={e => setRetentionCopies(Math.max(0, parseInt(e.target.value, 10) || 0))}
              helperText="0 = infinite retention copies"
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Repeats
            </Typography>

            <ToggleButtonGroup
              value={frequency}
              exclusive
              onChange={(_, val) => val && setFrequency(val)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="Hourly">Hourly</ToggleButton>
              <ToggleButton value="Daily">Daily</ToggleButton>
              <ToggleButton value="Weekly">Weekly</ToggleButton>
              <ToggleButton value="Monthly">Monthly</ToggleButton>
            </ToggleButtonGroup>

            {frequency === 'Weekly' && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="weekday-select-label">Day of the week</InputLabel>
                  <Select
                    labelId="weekday-select-label"
                    label="Day of the week"
                    value={weekDay}
                    onChange={e => setWeekDay(Number(e.target.value))}
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <MenuItem key={d.value} value={d.value}>
                        {d.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {frequency === 'Monthly' && (
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="monthday-select-label">Day of the month</InputLabel>
                  <Select
                    labelId="monthday-select-label"
                    label="Day of the month"
                    value={monthDay}
                    onChange={e => setMonthDay(Number(e.target.value))}
                  >
                    {DAYS_OF_MONTH.map(d => (
                      <MenuItem key={d} value={d}>
                        Day {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {frequency !== 'Hourly' ? (
              <Grid container spacing={1.5} alignItems="center">
                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="hour-select-label">Hour</InputLabel>
                    <Select
                      labelId="hour-select-label"
                      label="Hour"
                      value={hour}
                      onChange={e => setHour(Number(e.target.value))}
                    >
                      {HOURS.map(h => (
                        <MenuItem key={h} value={h}>
                          {h.toString().padStart(2, '0')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="minute-select-label">Minute</InputLabel>
                    <Select
                      labelId="minute-select-label"
                      label="Minute"
                      value={minute}
                      onChange={e => setMinute(Number(e.target.value))}
                    >
                      {MINUTES.map(m => (
                        <MenuItem key={m} value={m}>
                          {m.toString().padStart(2, '0')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4}>
                  <ToggleButtonGroup
                    value={ampm}
                    exclusive
                    onChange={(_, val) => val && setAmpm(val)}
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="AM">AM</ToggleButton>
                    <ToggleButton value="PM">PM</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>
              </Grid>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel id="hourly-minute-select-label">At minute</InputLabel>
                <Select
                  labelId="hourly-minute-select-label"
                  label="At minute"
                  value={minute}
                  onChange={e => setMinute(Number(e.target.value))}
                >
                  {MINUTES.map(m => (
                    <MenuItem key={m} value={m}>
                      :{m.toString().padStart(2, '0')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Alert
              severity="info"
              icon={<Icon icon="mdi:information-outline" width={20} />}
              sx={{ mt: 2 }}
            >
              {liveDescription}
            </Alert>
          </Box>

          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="backup-type-select-label">Backup type</InputLabel>
              <Select
                labelId="backup-type-select-label"
                label="Backup type"
                value={backupType}
                onChange={e => setBackupType(e.target.value)}
              >
                <MenuItem value="full">Full</MenuItem>
                <MenuItem value="incremental">Incremental</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid}
            color="primary"
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
