import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface BackupImportSpec {
  classRef: {
    name: string;
  };
  storageRef: {
    name: string;
  };
}

export type BackupImportState = 'Succeeded' | 'Failed' | 'Error' | string;

export interface BackupImportStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
  observedGeneration?: number;
}

export interface BackupImportStatus {
  state?: BackupImportState;
  createdCount?: number;
  discoveredCount?: number;
  lastObservedGeneration?: number;
  message?: string;
  conditions?: BackupImportStatusCondition[];
}

export interface BackupImportInterface extends KubeObjectInterface {
  spec: BackupImportSpec;
  status?: BackupImportStatus;
}

export class BackupImport extends KubeObject<BackupImportInterface> {
  static kind = 'BackupImport';
  static apiName = 'backupimports';
  static apiVersion = 'backup.openeverest.io/v1alpha1';
  static isNamespaced = true;

  get spec(): BackupImportSpec {
    return this.jsonData.spec;
  }

  get status(): BackupImportStatus | undefined {
    return this.jsonData.status;
  }

  get state(): BackupImportState {
    return this.status?.state ?? 'Pending';
  }

  get isSucceeded(): boolean {
    return this.state === 'Succeeded';
  }

  get className(): string {
    return this.spec?.classRef?.name || '-';
  }

  get storageName(): string {
    return this.spec?.storageRef?.name || '-';
  }

  get createdCount(): number {
    return this.status?.createdCount ?? 0;
  }

  get discoveredCount(): number {
    return this.status?.discoveredCount ?? 0;
  }
}
