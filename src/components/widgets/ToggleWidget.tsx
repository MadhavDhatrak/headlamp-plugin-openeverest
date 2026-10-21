import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Switch,
} from '@mui/material';
import React from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface ToggleWidgetProps {
  node: UiComponentNode;
  value: boolean | undefined;
  onChange: (path: string, value: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export const ToggleWidget: React.FC<ToggleWidgetProps> = ({
  node,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const fieldPath = node.path || node.id || '';
  const fieldParams = node.fieldParams || {};

  const isDisabled = disabled || !!fieldParams.disabled;
  const description = typeof node.description === 'string' ? node.description : undefined;
  const isChecked = !!value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fieldPath, e.target.checked);
  };

  return (
    <FormControl
      component="fieldset"
      margin="normal"
      error={!!error}
      disabled={isDisabled}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isChecked}
            onChange={handleChange}
            color="primary"
          />
        }
        label={fieldParams.label || node.label || fieldPath}
      />
      {(error || description) && (
        <FormHelperText>{error || description}</FormHelperText>
      )}
    </FormControl>
  );
};
