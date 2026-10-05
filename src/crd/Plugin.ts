import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface PluginExtensionPoint {
  label?: string;
  path?: string;
  type?: string;
  icon?: string;
}

export interface PluginBackend {
  serviceRef?: {
    name: string;
    namespace: string;
    port: number;
  };
}

export interface PluginFrontend {
  bundlePath?: string;
  extensionPoints?: PluginExtensionPoint[];
}

export interface PluginPermission {
  resource: string;
  verb: string;
}

export interface PluginSpec {
  displayName?: string;
  description?: string;
  version?: string;
  vendor?: string;
  enabled?: boolean;
  backend?: PluginBackend;
  frontend?: PluginFrontend;
  permissions?: PluginPermission[];
}

export interface PluginStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
  observedGeneration?: number;
}

export interface PluginStatus {
  phase?: string;
  conditions?: PluginStatusCondition[];
}

export interface PluginInterface extends KubeObjectInterface {
  spec: PluginSpec;
  status?: PluginStatus;
}

export class PluginResource extends KubeObject<PluginInterface> {
  static kind = 'Plugin';
  static apiName = 'plugins';
  static apiVersion = 'extensions.openeverest.io/v1alpha1';
  static isNamespaced = false;

  get spec(): PluginSpec {
    return this.jsonData.spec;
  }

  get status(): PluginStatus | undefined {
    return this.jsonData.status;
  }

  get isEnabled(): boolean {
    return this.spec?.enabled ?? true;
  }

  get isReady(): boolean {
    const readyCond = this.status?.conditions?.find(c => c.type === 'Ready');
    return readyCond?.status === 'True' || this.status?.phase === 'Ready';
  }
}
