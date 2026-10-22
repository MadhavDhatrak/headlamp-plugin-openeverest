import { Icon } from '@iconify/react';
import { Chip, CircularProgress, Tooltip } from '@mui/material';
import React from 'react';
import { BackupState } from '../crd/Backup';

export interface BackupStatusChipProps {
  state?: BackupState;
  message?: string;
}

export function BackupStatusChip({ state = 'Pending', message }: BackupStatusChipProps) {
  let color: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
  let icon: React.ReactElement | undefined;

  switch (state) {
    case 'Succeeded':
      color = 'success';
      icon = <Icon icon="mdi:check-circle" width={16} height={16} />;
      break;

    case 'Running':
      color = 'info';
      icon = <CircularProgress size={12} color="inherit" thickness={5} />;
      break;

    case 'Pending':
      color = 'warning';
      icon = <Icon icon="mdi:clock-outline" width={16} height={16} />;
      break;

    case 'Failed':
      color = 'error';
      icon = <Icon icon="mdi:alert-circle" width={16} height={16} />;
      break;

    default:
      color = 'default';
      icon = <Icon icon="mdi:help-circle" width={16} height={16} />;
      break;
  }

  const chip = (
    <Chip
      size="small"
      color={color}
      label={state}
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

  if (message) {
    return (
      <Tooltip title={message} arrow placement="top">
        <span>{chip}</span>
      </Tooltip>
    );
  }

  return chip;
}
