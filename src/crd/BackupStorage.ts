import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupStorageLocation {
  objectStore?: {
    bucket?: string;
    prefix?: string;
  };
}

export interface BackupStorageParameters {
  region?: string;
  endpointURL?: string;
  forcePathStyle?: boolean;
  implementation?: string;
  [key: string]: unknown;
}

export interface BackupStorageAuthentication {
  mode?: string;
  credentialsSecretRef?: {
    name?: string;
  };
}

export interface BackupStorageSpec {
  backupStorageClassRef?: { name?: string };
  location?: BackupStorageLocation;
  parameters?: BackupStorageParameters;
  authentication?: BackupStorageAuthentication;
  tls?: Record<string, unknown>;
}

export type BackupStorageStatus = Record<string, unknown>;

export interface BackupStorageInterface extends KubeObjectInterface {
  spec: BackupStorageSpec;
  status?: BackupStorageStatus;
}

export class BackupStorage extends KubeObject<BackupStorageInterface> {
  static kind = 'BackupStorage';
  static apiName = 'backupstorages';
  static apiVersion = 'backup.openeverest.io/v1alpha1';
  static isNamespaced = true;

  get spec(): BackupStorageSpec {
    return this.jsonData.spec;
  }

  get status(): BackupStorageStatus | undefined {
    return this.jsonData.status;
  }

  get storageType(): string {
    return this.spec?.backupStorageClassRef?.name || 's3';
  }

  get bucket(): string {
    return this.spec?.location?.objectStore?.bucket || '-';
  }

  get region(): string {
    return this.spec?.parameters?.region || '-';
  }

  get endpointURL(): string {
    return this.spec?.parameters?.endpointURL || '-';
  }

  get secretName(): string {
    return this.spec?.authentication?.credentialsSecretRef?.name || '-';
  }
}

