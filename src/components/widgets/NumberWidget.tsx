import { InputAdornment, TextField } from '@mui/material';
import React from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface NumberWidgetProps {
  node: UiComponentNode;
  value: number | string | undefined;
  onChange: (path: string, value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export const NumberWidget: React.FC<NumberWidgetProps> = ({
  node,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const fieldPath = node.path || node.id || '';
  const fieldParams = node.fieldParams || {};
  const validation = node.validation || {};

  const min = fieldParams.min;
  const max = fieldParams.max;
  const step = fieldParams.step ?? 1;
  const badge = fieldParams.badge;
  const isRequired = !!validation.required;
  const isDisabled = disabled || !!fieldParams.disabled;
  const description = typeof node.description === 'string' ? node.description : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(fieldPath, undefined);
      return;
    }
    const parsed = Number(raw);
    onChange(fieldPath, Number.isNaN(parsed) ? undefined : parsed);
  };

  return (
    <TextField
      fullWidth
      type="number"
      label={fieldParams.label || node.label || fieldPath}
      value={value === undefined || value === null ? '' : value}
      onChange={handleChange}
      required={isRequired}
      disabled={isDisabled}
      error={!!error}
      helperText={error || description}
      placeholder={fieldParams.placeholder}
      inputProps={{
        min,
        max,
        step,
      }}
      InputProps={
        badge
          ? {
              endAdornment: (
                <InputAdornment position="end">{badge}</InputAdornment>
              ),
            }
          : undefined
      }
      margin="normal"
      size="small"
    />
  );
};
