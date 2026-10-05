import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface VersionBundle {
  name: string;
  default?: boolean;
  components?: Record<string, string>;
}

export interface ComponentVersion {
  version: string;
  image?: string;
  default?: boolean;
}

export interface ComponentType {
  versions?: ComponentVersion[];
}

export interface ProviderSpec {
  defaultVersion?: string;
  versions?: VersionBundle[];
  componentTypes?: Record<string, ComponentType>;
  components?: Record<string, unknown>;
  topologies?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
}

export interface ProviderStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface ProviderStatus {
  phase?: string;
  conditions?: ProviderStatusCondition[];
  observedGeneration?: number;
}

export interface ProviderInterface extends KubeObjectInterface {
  spec: ProviderSpec;
  status?: ProviderStatus;
}

export class Provider extends KubeObject<ProviderInterface> {
  static kind = 'Provider';
  static apiName = 'providers';
  static apiVersion = 'core.openeverest.io/v1alpha1';
  static isNamespaced = false;

  get spec(): ProviderSpec {
    return this.jsonData.spec;
  }

  get status(): ProviderStatus | undefined {
    return this.jsonData.status;
  }

  get isReady(): boolean {
    if (!this.status) return true;
    const ready = this.status.conditions?.find(c => c.type === 'Ready');
    if (ready) return ready.status === 'True';
    return this.status.phase ? this.status.phase === 'Ready' : true;
  }

  get defaultVersion(): string | undefined {
    return this.spec?.versions?.find(v => v.default)?.name ?? this.spec?.defaultVersion;
  }

  get availableVersions(): string[] {
    return this.spec?.versions?.map(v => v.name) || [];
  }

  get chartVersion(): string | undefined {
    return this.jsonData.metadata?.labels?.['app.kubernetes.io/version'];
  }
}
