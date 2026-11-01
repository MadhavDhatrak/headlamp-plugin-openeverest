import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React, { useState } from 'react';
import { Instance } from '../crd/Instance';
import { deleteScheduleFromInstance, InstanceScheduleRow } from '../utils/backupSchedules';

export interface DeleteScheduleDialogProps {
  open: boolean;
  schedule: InstanceScheduleRow | null;
  instance: Instance | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteScheduleDialog({
  open,
  schedule,
  instance,
  onClose,
  onDeleted,
}: DeleteScheduleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!schedule || !instance) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const patchPayload = deleteScheduleFromInstance(instance, schedule.name);
      await instance.patch(patchPayload);
      setIsDeleting(false);
      onDeleted?.();
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err?.message || 'Failed to delete schedule from database instance');
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Backup Schedule</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Are you sure you want to delete the schedule <strong>{schedule.name}</strong> for database{' '}
          <strong>{schedule.instanceName}</strong>?
        </DialogContentText>
        <DialogContentText variant="body2" color="text.secondary">
          Everest will no longer create recurring backups for this schedule. Existing backup snapshots will not be deleted.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isDeleting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          color="error"
          variant="contained"
        >
          {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

