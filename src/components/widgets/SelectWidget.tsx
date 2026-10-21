import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import React from 'react';
import { SelectOption, UiComponentNode } from '../../schema/uiSchema';

export interface SelectWidgetProps {
  node: UiComponentNode;
  value: string | number | undefined;
  onChange: (path: string, value: string | number | undefined) => void;
  options?: SelectOption[];
  error?: string;
  disabled?: boolean;
}

export const SelectWidget: React.FC<SelectWidgetProps> = ({
  node,
  value,
  onChange,
  options: externalOptions,
  error,
  disabled = false,
}) => {
  const fieldPath = node.path || node.id || '';
  const fieldParams = node.fieldParams || {};
  const validation = node.validation || {};

  const isRequired = !!validation.required;
  const isDisabled = disabled || !!fieldParams.disabled;
  const description = typeof node.description === 'string' ? node.description : undefined;
  const options: SelectOption[] = externalOptions || fieldParams.options || [];

  const handleChange = (e: SelectChangeEvent<string | number>) => {
    const selected = e.target.value;
    onChange(fieldPath, selected === '' ? undefined : selected);
  };

  const labelId = `${fieldPath}-select-label`;

  return (
    <FormControl
      fullWidth
      margin="normal"
      size="small"
      required={isRequired}
      disabled={isDisabled}
      error={!!error}
    >
      <InputLabel id={labelId}>{fieldParams.label || node.label || fieldPath}</InputLabel>
      <Select
        labelId={labelId}
        label={fieldParams.label || node.label || fieldPath}
        value={value === undefined || value === null ? '' : value}
        onChange={handleChange}
      >
        {fieldParams.displayEmpty && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {options.map(opt => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {(error || description) && (
        <FormHelperText>{error || description}</FormHelperText>
      )}
    </FormControl>
  );
};
