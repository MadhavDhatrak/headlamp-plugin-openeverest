import {
  Box,
  Collapse,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface GroupWidgetProps {
  node: UiComponentNode;
  values?: Record<string, any>;
  onChange?: (path: string, value: any) => void;
  disabled?: boolean;
  renderWidget?: (childNode: UiComponentNode) => React.ReactNode;
}

export const GroupWidget: React.FC<GroupWidgetProps> = ({
  node,
  values,
  onChange,
  disabled = false,
  renderWidget,
}) => {
  const isToggleable = node.groupType === 'toggleable';
  const isLine = node.groupType === 'line';
  const components = node.components || {};
  const order =
    node.componentsOrder && node.componentsOrder.length > 0
      ? node.componentsOrder
      : Object.keys(components);
  const description = typeof node.description === 'string' ? node.description : undefined;
  const label = node.fieldParams?.label || node.label;
  const fieldKey = node.path || node.id || 'podSchedulingPolicy';

  const hasActiveValues =
    values &&
    (values[fieldKey] === true ||
      Object.keys(values).some(
        k =>
          k.includes('schedulingPolicy') &&
          values[k] !== undefined &&
          values[k] !== null &&
          values[k] !== ''
      ));

  const [enabled, setEnabled] = useState<boolean>(
    node.fieldParams?.defaultValue === true || !!hasActiveValues
  );

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = e.target.checked;
    setEnabled(nextChecked);

    if (onChange) {
      onChange(fieldKey, nextChecked);
      if (!nextChecked) {
        ['engine', 'monitoring', 'proxy'].forEach(comp => {
          onChange(`spec.components.${comp}.schedulingPolicy`, undefined);
        });
        order.forEach(key => {
          const child = components[key];
          const path = child?.path || child?.id || key;
          if (path && path !== fieldKey) {
            onChange(path, undefined);
          }
        });
      }
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        my: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        {label && (
          <Typography variant="subtitle1" fontWeight={600}>
            {label}
          </Typography>
        )}
        {isToggleable && (
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={handleToggle}
                disabled={disabled}
                color="primary"
              />
            }
            label="Enable"
            labelPlacement="end"
            sx={{ m: 0 }}
          />
        )}
      </Box>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
          {description}
        </Typography>
      )}

      <Collapse in={!isToggleable || enabled} unmountOnExit={false}>
        {isToggleable && <Divider sx={{ my: 1.5 }} />}
        <Box
          display="flex"
          flexDirection={isLine ? { xs: 'column', sm: 'row' } : 'column'}
          gap={2}
        >
          {order.map(key => {
            const childNode = components[key];
            if (!childNode) return null;
            const nodeWithId = childNode.id ? childNode : { ...childNode, id: key };
            if (renderWidget) {
              return (
                <React.Fragment key={nodeWithId.path || nodeWithId.id || key}>
                  {renderWidget(nodeWithId)}
                </React.Fragment>
              );
            }
            return null;
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};
