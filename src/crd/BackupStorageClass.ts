import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupStorageClassAuthMode {
  name: string;
  credentials?: {
    required?: string[];
  };
}

export interface BackupStorageClassSpec {
  displayName?: string;
  description?: string;
  authModes?: BackupStorageClassAuthMode[];
  parametersSchema?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  validations?: Array<{
    expression?: string;
    message?: string;
    reason?: string;
  }>;
}

export interface BackupStorageClassInterface extends KubeObjectInterface {
  spec: BackupStorageClassSpec;
  status?: Record<string, unknown>;
}

export class BackupStorageClass extends KubeObject<BackupStorageClassInterface> {
  static kind = 'BackupStorageClass';
  static apiName = 'backupstorageclasses';
  static apiVersion = 'backup.openeverest.io/v1alpha1';
  static isNamespaced = false;

  get spec(): BackupStorageClassSpec {
    return this.jsonData.spec;
  }

  get displayName(): string {
    return this.spec?.displayName || this.metadata.name;
  }

  get description(): string {
    return this.spec?.description || '';
  }

  get authModes(): BackupStorageClassAuthMode[] {
    return this.spec?.authModes || [];
  }
}
