import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupClassProviderManagedLimits {
  maxStorages?: number;
  maxSchedulesPerStorage?: number;
  maxPITREnabledStorages?: number;
}

export interface BackupClassProviderManaged {
  supportsPITR?: boolean;
  limits?: BackupClassProviderManagedLimits;
  pitrParametersSchema?: Record<string, unknown>;
  providerRef?: {
    name?: string;
  };
}

export interface BackupClassInstanceConstraints {
  requiredFields?: string[];
}

export interface BackupClassStorageClassConfig {
  name: string;
  authModes: string[];
  parametersSchema?: Record<string, unknown>;
  tls?: {
    customCA?: 'Supported' | 'None';
    insecureSkipVerify?: 'Supported' | 'None';
  };
}

export interface BackupClassSpec {
  displayName?: string;
  description?: string;
  executionMode: 'ProviderManaged';
  backupStorageClasses: BackupClassStorageClassConfig[];
  providerManaged?: BackupClassProviderManaged;
  instanceConstraints?: BackupClassInstanceConstraints;
  parametersSchema?: Record<string, unknown>;
  restoreParametersSchema?: Record<string, unknown>;
  supportsImport?: boolean;
  uiSchema?: Record<string, unknown>;
}

export interface BackupClassStatusProvider {
  name: string;
  compatibility: 'Compatible' | 'Pending' | 'Incompatible';
  classGeneration?: number;
  message?: string;
  reason?: string;
}

export interface BackupClassStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime: string;
  reason: string;
  message: string;
  observedGeneration?: number;
}

export interface BackupClassStatus {
  conditions?: BackupClassStatusCondition[];
  providers?: BackupClassStatusProvider[];
}

export interface BackupClassInterface extends KubeObjectInterface {
  spec: BackupClassSpec;
  status?: BackupClassStatus;
}

export class BackupClass extends KubeObject<BackupClassInterface> {
  static kind = 'BackupClass';
  static apiName = 'backupclasses';
  static apiVersion = 'backup.openeverest.io/v1alpha1';
  static isNamespaced = false;

  get spec(): BackupClassSpec {
    return this.jsonData.spec;
  }

  get displayName(): string {
    return this.spec?.displayName || this.metadata.name;
  }

  get executionMode(): string {
    return this.spec?.executionMode || 'ProviderManaged';
  }

  get supportedProviders(): string[] {
    const fromRef = this.spec?.providerManaged?.providerRef?.name;
    return fromRef ? [fromRef] : [];
  }

  get supportsPITR(): boolean {
    return this.spec?.providerManaged?.supportsPITR ?? false;
  }

  get limits(): BackupClassProviderManagedLimits | undefined {
    return this.spec?.providerManaged?.limits;
  }

  get backupUiSchema(): Record<string, any> | undefined {
    return (this.spec?.uiSchema as any)?.backup;
  }

  get pitrUiSchema(): Record<string, any> | undefined {
    return (this.spec?.uiSchema as any)?.pitr;
  }

  get restoreUiSchema(): Record<string, any> | undefined {
    return (this.spec?.uiSchema as any)?.restore;
  }
}
