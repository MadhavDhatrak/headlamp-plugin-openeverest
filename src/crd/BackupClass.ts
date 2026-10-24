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
}

export interface BackupClassInstanceConstraints {
  requiredFields?: string[];
}

export interface BackupClassSpec {
  displayName?: string;
  description?: string;
  executionMode: 'ProviderManaged' | 'Job' | string;
  supportedProviders?: string[];
  providerManaged?: BackupClassProviderManaged;
  instanceConstraints?: BackupClassInstanceConstraints;
  job?: Record<string, unknown>;
  parametersSchema?: Record<string, unknown>;
  restoreParametersSchema?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
}

export interface BackupClassInterface extends KubeObjectInterface {
  spec: BackupClassSpec;
  status?: Record<string, unknown>;
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
    return this.spec?.supportedProviders || [];
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
