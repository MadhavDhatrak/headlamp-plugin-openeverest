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
import { BackupStorage } from '../crd/BackupStorage';

export interface DeleteBackupStorageDialogProps {
  open: boolean;
  storage: BackupStorage | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteBackupStorageDialog({
  open,
  storage,
  onClose,
  onDeleted,
}: DeleteBackupStorageDialogProps) {
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!storage) return null;

  const storageName = storage.metadata.name;
  const isMatch = confirmName === storageName;

  const handleDelete = async () => {
    if (!isMatch) return;
    setIsDeleting(true);
    setError(null);
    try {
      await storage.delete();
      setIsDeleting(false);
      setConfirmName('');
      onDeleted?.();
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err?.message || 'Failed to delete backup storage');
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
      <DialogTitle>Delete Backup Storage</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This will delete the backup storage configuration <strong>{storageName}</strong> from Kubernetes. To confirm, please type{' '}
          <strong>{storageName}</strong> below:
        </DialogContentText>
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder={storageName}
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
