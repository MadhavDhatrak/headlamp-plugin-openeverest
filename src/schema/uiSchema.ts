export type UiType =
  | 'number'
  | 'select'
  | 'text'
  | 'toggle'
  | 'group'
  | 'widget'
  | string;

export type GroupType = 'line' | 'toggleable' | 'accordion' | string;

export interface SelectOption {
  label: string;
  value: string;
}

export interface FieldParams {
  label?: string;
  defaultValue?: unknown;
  helperText?: string;
  placeholder?: string;
  step?: number;
  badge?: string;
  badgeToApi?: boolean;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  options?: SelectOption[];
  optionsPath?: string;
  optionsPathConfig?: {
    labelPath: string;
    valuePath: string;
  };
  displayEmpty?: boolean;
  modes?: Record<string, { disabled?: boolean; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface UiValidation {
  required?: boolean;
  min?: number;
  max?: number;
  int?: boolean;
  regex?: {
    pattern: string;
    message: string;
  };
  celExpressions?: Array<{
    celExpr: string;
    message: string;
  }>;
  modes?: Record<string, unknown>;
}

export interface DataSourceConfig {
  provider?: 'storageClasses' | 'monitoringConfigs' | string;
  [key: string]: unknown;
}

export interface UiComponentNode {
  uiType: UiType;
  path?: string;
  id?: string;
  fieldParams?: FieldParams;
  validation?: UiValidation;
  dataSource?: DataSourceConfig;
  groupType?: GroupType;
  label?: string;
  widgetType?: string;
  components?: Record<string, UiComponentNode>;
  componentsOrder?: string[];
  [key: string]: unknown;
}

export interface UiSection {
  label: string;
  description?: string;
  componentsOrder: string[];
  components: Record<string, UiComponentNode>;
}

export interface UiTopologySchema {
  sectionsOrder: string[];
  sections: Record<string, UiSection>;
}

export type ProviderUiSchema = Record<string, UiTopologySchema>;

export function resolveTopologyUi(
  providerSpec?: {
    uiSchema?: Record<string, unknown>;
    [key: string]: unknown;
  },
  topologyName = ''
): UiTopologySchema | undefined {
  if (!providerSpec || !topologyName) return undefined;

  const fromUiSchema = providerSpec.uiSchema?.[topologyName] as UiTopologySchema | undefined;
  if (fromUiSchema && fromUiSchema.sections && fromUiSchema.sectionsOrder) {
    return fromUiSchema;
  }

  return undefined;
}
