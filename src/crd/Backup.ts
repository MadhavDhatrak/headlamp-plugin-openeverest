import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export type BackupOriginType = 'Instance' | 'External';

export interface BackupOriginInstanceRef {
  name: string;
}

export interface BackupOriginExternal {
  path?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface BackupOrigin {
  type: BackupOriginType;
  instanceRef?: BackupOriginInstanceRef;
  external?: BackupOriginExternal;
}

export interface BackupStorageRef {
  name: string;
}

export interface BackupClassRef {
  name: string;
}

export type BackupDeletionPolicy = 'Delete' | 'Retain';

export interface BackupSpec {
  origin: BackupOrigin;
  storageRef: BackupStorageRef;
  classRef?: BackupClassRef;
  deletionPolicy?: BackupDeletionPolicy;
  parameters?: Record<string, unknown>;
  scheduleName?: string;
}

export type BackupState = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | string;

export interface BackupStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
  observedGeneration?: number;
}

export interface BackupStatus {
  state?: BackupState;
  size?: string;
  startedAt?: string;
  completedAt?: string;
  message?: string;
  executionMode?: 'ProviderManaged' | 'Job' | string;
  jobRef?: {
    name: string;
  };
  operatorBackupRef?: {
    group?: string;
    kind: string;
    name: string;
  };
  conditions?: BackupStatusCondition[];
}

export interface BackupInterface extends KubeObjectInterface {
  spec: BackupSpec;
  status?: BackupStatus;
}

export class Backup extends KubeObject<BackupInterface> {
  static kind = 'Backup';
  static apiName = 'backups';
  static apiVersion = 'backup.openeverest.io/v1alpha1';
  static isNamespaced = true;

  get spec(): BackupSpec {
    return this.jsonData.spec;
  }

  get status(): BackupStatus | undefined {
    return this.jsonData.status;
  }

  get state(): BackupState {
    return this.status?.state ?? 'Pending';
  }

  get isCompleted(): boolean {
    return this.state === 'Succeeded';
  }

  get isFailed(): boolean {
    return this.state === 'Failed';
  }

  get isRunning(): boolean {
    return this.state === 'Running';
  }

  get targetInstanceName(): string {
    return this.spec?.origin?.instanceRef?.name || '-';
  }

  get storageName(): string {
    return this.spec?.storageRef?.name || '-';
  }

  get backupSize(): string {
    return this.status?.size || '-';
  }

  get startedAt(): string | undefined {
    return this.status?.startedAt;
  }

  get completedAt(): string | undefined {
    return this.status?.completedAt;
  }

  get message(): string | undefined {
    return this.status?.message;
  }
}
