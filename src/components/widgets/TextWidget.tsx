import { TextField } from '@mui/material';
import React from 'react';
import { UiComponentNode } from '../../schema/uiSchema';

export interface TextWidgetProps {
  node: UiComponentNode;
  value: string | undefined;
  onChange: (path: string, value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export const TextWidget: React.FC<TextWidgetProps> = ({
  node,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const fieldPath = node.path || node.id || '';
  const fieldParams = node.fieldParams || {};
  const validation = node.validation || {};

  const isRequired = !!validation.required;
  const isDisabled = disabled || !!fieldParams.disabled;
  const description = typeof node.description === 'string' ? node.description : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(fieldPath, raw === '' ? undefined : raw);
  };

  return (
    <TextField
      fullWidth
      type="text"
      label={node.label || fieldPath}
      value={value === undefined || value === null ? '' : value}
      onChange={handleChange}
      required={isRequired}
      disabled={isDisabled}
      error={!!error}
      helperText={error || description}
      placeholder={fieldParams.placeholder}
      margin="normal"
      size="small"
    />
  );
};
