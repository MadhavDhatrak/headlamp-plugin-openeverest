import { Box, Paper, Typography } from '@mui/material';
import React from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface GroupWidgetProps {
  node: UiComponentNode;
  renderWidget?: (childNode: UiComponentNode) => React.ReactNode;
}

export const GroupWidget: React.FC<GroupWidgetProps> = ({
  node,
  renderWidget,
}) => {
  const components = node.components || {};
  const order = node.componentsOrder || [];
  const description = typeof node.description === 'string' ? node.description : undefined;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        my: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      {node.label && (
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {node.label}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      <Box display="flex" flexDirection="column" gap={1}>
        {order.map(key => {
          const childNode = components[key];
          if (!childNode) return null;
          if (renderWidget) {
            return (
              <React.Fragment key={childNode.path || childNode.id || key}>
                {renderWidget(childNode)}
              </React.Fragment>
            );
          }
          return null;
        })}
      </Box>
    </Paper>
  );
};
