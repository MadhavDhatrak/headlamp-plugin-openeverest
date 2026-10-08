import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import React, { useState } from 'react';
import { Instance } from '../crd/Instance';

export interface DeleteDatabaseDialogProps {
  open: boolean;
  instance: Instance | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteDatabaseDialog({
  open,
  instance,
  onClose,
  onDeleted,
}: DeleteDatabaseDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!instance) return null;

  const instanceName = instance.metadata.name;
  const isMatch = confirmName === instanceName;

  const handleDelete = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    setError(null);
    try {
      await instance.delete();
      setIsDeleting(false);
      setConfirmName('');
      onDeleted?.();
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err?.message || 'Failed to delete database instance');
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Database</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This action cannot be undone. To confirm, please type{' '}
          <strong>{instanceName}</strong> below:
        </DialogContentText>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder={instanceName}
          value={confirmName}
          onChange={e => setConfirmName(e.target.value)}
          disabled={isDeleting}
        />
        {error && (
          <DialogContentText color="error" sx={{ mt: 2 }}>
            {error}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isDeleting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={!isMatch || isDeleting}
          color="error"
          variant="contained"
        >
          {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
