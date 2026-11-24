import { Icon } from '@iconify/react';
import { Chip, CircularProgress } from '@mui/material';
import React from 'react';
import { InstancePhase } from '../crd/Instance';

export interface DatabaseStatusChipProps {
  phase?: InstancePhase | string;
}

export function DatabaseStatusChip({ phase = 'Pending' }: DatabaseStatusChipProps) {
  let color: 'success' | 'warning' | 'error' | 'default' = 'default';
  let icon: React.ReactElement | undefined;

  switch (phase) {
    case 'Ready':
    case 'Available':
      color = 'success';
      icon = <Icon icon="mdi:check-circle" width={16} height={16} />;
      break;

    case 'Creating':
    case 'Pending':
    case 'Provisioned':
    case 'ApplyingChanges':
    case 'Restoring':
    case 'Upgrading':
    case 'StorageResizing':
    case 'Scaling':
      color = 'warning';
      icon = <CircularProgress size={12} color="inherit" thickness={5} />;
      break;

    case 'CrashLoopBackOff':
    case 'ImagePullBackOff':
    case 'CreateContainerConfigError':
    case 'Unschedulable':
    case 'ProviderNotFound':
    case 'NotResponding':
    case 'ValidationFailed':
    case 'ReconcileError':
    case 'EngineError':
    case 'AwaitingApproval':
    case 'UserSecretNotFound':
    case 'InvalidReference':
    case 'BackupStorageNotFound':
    case 'BackupClassNotFound':
    case 'BackupStorageCredentialsNotFound':
    case 'NotReady':
    case 'RetriesExhausted':
    case 'ProgressDeadlineExceeded':
    case 'Stalled':
    case 'NeedsAttention':
      color = 'error';
      icon = <Icon icon="mdi:alert-circle" width={16} height={16} />;
      break;

    case 'Suspended':
      color = 'default';
      icon = <Icon icon="mdi:pause-circle" width={16} height={16} />;
      break;

    case 'Terminating':
      color = 'warning';
      icon = <CircularProgress size={12} color="inherit" thickness={5} />;
      break;

    default: {
      const lower = String(phase).toLowerCase();
      if (lower.includes('error') || lower.includes('fail') || lower.includes('crash')) {
        color = 'error';
        icon = <Icon icon="mdi:alert-circle" width={16} height={16} />;
      } else {
        color = 'warning';
        icon = <CircularProgress size={12} color="inherit" thickness={5} />;
      }
      break;
    }
  }

  return (
    <Chip
      size="small"
      color={color}
      label={phase}
      icon={icon}
      variant="outlined"
      sx={{
        fontWeight: 600,
        textTransform: 'none',
        '& .MuiChip-icon': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    />
  );
}
