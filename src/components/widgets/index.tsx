import React from 'react';
import { SelectOption, UiComponentNode } from '../../schema/uiSchema';
import { GroupWidget } from './GroupWidget';
import { NumberWidget } from './NumberWidget';
import { SelectWidget } from './SelectWidget';
import { TextWidget } from './TextWidget';
import { ToggleWidget } from './ToggleWidget';
import { UnknownWidgetFallback } from './UnknownWidgetFallback';

export interface WidgetRendererProps {
  node: UiComponentNode;
  values: Record<string, any>;
  onChange: (path: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  customOptions?: Record<string, SelectOption[]>;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  node,
  values,
  onChange,
  errors,
  disabled = false,
  customOptions,
}) => {
  const fieldPath = node.path || node.id || '';
  const value = fieldPath ? values[fieldPath] : undefined;
  const error = fieldPath && errors ? errors[fieldPath] : undefined;

  switch (node.uiType) {
    case 'number':
      return (
        <NumberWidget
          node={node}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'text':
      return (
        <TextWidget
          node={node}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <SelectWidget
          node={node}
          value={value}
          onChange={onChange}
          options={customOptions?.[fieldPath]}
          error={error}
          disabled={disabled}
        />
      );
    case 'toggle':
      return (
        <ToggleWidget
          node={node}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'group':
      return (
        <GroupWidget
          node={node}
          renderWidget={childNode => (
            <WidgetRenderer
              node={childNode}
              values={values}
              onChange={onChange}
              errors={errors}
              disabled={disabled}
              customOptions={customOptions}
            />
          )}
        />
      );
    default:
      return <UnknownWidgetFallback node={node} />;
  }
};

export * from './GroupWidget';
export * from './NumberWidget';
export * from './SelectWidget';
export * from './TextWidget';
export * from './ToggleWidget';
export * from './UnknownWidgetFallback';
