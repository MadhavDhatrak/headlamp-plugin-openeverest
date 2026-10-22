import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupStorageS3Config {
  bucket: string;
  region: string;
  endpointURL: string;
  credentialsSecretRef: {
    name: string;
  };
  forcePathStyle?: boolean;
  verifyTLS?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export type BackupStorageType = 's3' | string;

export interface BackupStorageSpec {
  type: BackupStorageType;
  s3?: BackupStorageS3Config;
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
    return this.spec?.type || 's3';
  }

  get bucket(): string {
    return this.spec?.s3?.bucket || '-';
  }

  get region(): string {
    return this.spec?.s3?.region || '-';
  }

  get endpointURL(): string {
    return this.spec?.s3?.endpointURL || '-';
  }

  get secretName(): string {
    return this.spec?.s3?.credentialsSecretRef?.name || '-';
  }
}
