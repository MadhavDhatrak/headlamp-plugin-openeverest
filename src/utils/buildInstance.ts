import { UiComponentNode, UiTopologySchema } from '../schema/uiSchema';

export interface BuildInstanceParams {
  name: string;
  namespace?: string;
  providerName: string;
  topologyName: string;
  version?: string;
  formValues: Record<string, any>;
  topologySchema?: UiTopologySchema;
}

export interface KubeInstancePayload {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    providerRef: {
      name: string;
    };
    version?: string;
    deletionPolicy?: string;
    topology: {
      type: string;
    };
    components?: Record<string, any>;
    [key: string]: any;
  };
}

export function setIn(obj: Record<string, any>, path: string, value: any): void {
  if (!path || value === undefined || value === null || value === '') return;

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = value;
}

export function flattenComponents(components: Record<string, UiComponentNode> = {}): UiComponentNode[] {
  const result: UiComponentNode[] = [];

  for (const key of Object.keys(components)) {
    const node = components[key];
    if (!node) continue;

    if (node.components) {
      result.push(...flattenComponents(node.components));
    } else {
      result.push(node);
    }
  }

  return result;
}

export function extractDefaultValues(uiSchema?: UiTopologySchema): Record<string, any> {
  const defaults: Record<string, any> = {};
  if (!uiSchema || !uiSchema.sections) return defaults;

  for (const sectionKey of Object.keys(uiSchema.sections)) {
    const section = uiSchema.sections[sectionKey];
    if (!section || !section.components) continue;

    const flatNodes = flattenComponents(section.components);
    for (const node of flatNodes) {
      const fieldKey = node.path || node.id;
      if (!fieldKey) continue;

      if (node.fieldParams && node.fieldParams.defaultValue !== undefined) {
        defaults[fieldKey] = node.fieldParams.defaultValue;
      }
    }
  }

  return defaults;
}

export function buildInstancePayload(params: BuildInstanceParams): KubeInstancePayload {
  const {
    name,
    namespace = 'default',
    providerName,
    topologyName,
    version,
    formValues,
    topologySchema,
  } = params;

  const allNodes: UiComponentNode[] = [];
  if (topologySchema && topologySchema.sections) {
    for (const sectionKey of Object.keys(topologySchema.sections)) {
      const section = topologySchema.sections[sectionKey];
      if (section && section.components) {
        allNodes.push(...flattenComponents(section.components));
      }
    }
  }

  const nodeMapByPath = new Map<string, UiComponentNode>();
  for (const node of allNodes) {
    if (node.path) {
      nodeMapByPath.set(node.path, node);
    }
  }

  const payload: KubeInstancePayload = {
    apiVersion: 'core.openeverest.io/v1alpha1',
    kind: 'Instance',
    metadata: {
      name,
      namespace,
    },
    spec: {
      providerRef: {
        name: providerName,
      },
      deletionPolicy: 'Delete',
      topology: {
        type: topologyName,
      },
    },
  };

  const finalVersion = version || formValues['spec.version'];
  if (finalVersion) {
    payload.spec.version = finalVersion;
  }

  for (const [key, rawValue] of Object.entries(formValues)) {
    if (!key.startsWith('spec.')) continue;
    if (key === 'spec.version') continue;
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

    let valueToStore = rawValue;
    const node = nodeMapByPath.get(key); 

    if (node && node.fieldParams && node.fieldParams.badgeToApi && node.fieldParams.badge) {
      const badge = node.fieldParams.badge;
      const strVal = String(rawValue).trim();
      if (!strVal.endsWith(badge)) {
        valueToStore = `${strVal}${badge}`;
      } 
    }

    const pathWithoutSpecPrefix = key.substring('spec.'.length);
    setIn(payload.spec, pathWithoutSpecPrefix, valueToStore);
  }

  return payload;
}
