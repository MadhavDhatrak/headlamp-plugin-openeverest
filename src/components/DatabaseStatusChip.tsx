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
      color = 'success';
      icon = <Icon icon="mdi:check-circle" width={16} height={16} />;
      break;

    case 'Provisioning':
    case 'Initializing':
    case 'Pending':
    case 'Updating':
    case 'Restoring':
    case 'Resuming':
      color = 'warning';
      icon = <CircularProgress size={12} color="inherit" thickness={5} />;
      break;

    case 'Failed':
      color = 'error';
      icon = <Icon icon="mdi:alert-circle" width={16} height={16} />;
      break;

    case 'Suspended':
    case 'Suspending':
      color = 'default';
      icon = <Icon icon="mdi:pause-circle" width={16} height={16} />;
      break;

    case 'Terminating':
      color = 'error';
      icon = <Icon icon="mdi:delete-clock" width={16} height={16} />;
      break;

    default:
      color = 'default';
      icon = <Icon icon="mdi:help-circle" width={16} height={16} />;
      break;
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
