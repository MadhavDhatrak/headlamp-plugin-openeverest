import { Alert, Box } from '@mui/material';
import React from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface UnknownWidgetFallbackProps {
  node: UiComponentNode;
}

export const UnknownWidgetFallback: React.FC<UnknownWidgetFallbackProps> = ({ node }) => {
  return (
    <Box my={1}>
      <Alert severity="info">
        Unsupported field type: {node.uiType || 'unknown'} ({node.label || node.id || node.path})
      </Alert>
    </Box>
  );
};
