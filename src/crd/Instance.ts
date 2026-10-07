import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface InstanceComponentStorage {
  size?: string;
  storageClass?: string;
}

export interface InstanceComponentResources {
  limits?: {
    cpu?: string;
    memory?: string;
    [key: string]: string | undefined;
  };
  requests?: {
    cpu?: string;
    memory?: string;
    [key: string]: string | undefined;
  };
  claims?: Array<{
    name: string;
    request?: string;
  }>;
}

export interface InstanceComponentService {
  serviceType?: 'ClusterIP' | 'NodePort' | 'LoadBalancer' | string;
  annotations?: Record<string, string>;
  loadBalancerService?: {
    sourceRanges?: string[];
  };
}

export interface InstanceComponentSchedulingPolicy {
  affinity?: Record<string, unknown>;
  nodeSelector?: Record<string, string>;
  schedulerName?: string;
  tolerations?: Array<{
    key?: string;
    operator?: string;
    value?: string;
    effect?: string;
    tolerationSeconds?: number;
  }>;
  topologySpreadConstraints?: Array<Record<string, unknown>>;
}

export interface InstanceComponent {
  name?: string;
  type?: string;
  version?: string;
  image?: string;
  replicas?: number;
  storage?: InstanceComponentStorage;
  resources?: InstanceComponentResources;
  service?: InstanceComponentService;
  schedulingPolicy?: InstanceComponentSchedulingPolicy;
  parameters?: Record<string, unknown>;
}

export interface InstanceTopology {
  type?: string;
  parameters?: Record<string, unknown>;
}

export interface InstanceBackupSchedule {
  name: string;
  cron: string;
  enabled: boolean;
  retentionCopies?: number;
  parameters?: Record<string, unknown>;
}

export interface InstanceBackupStorage {
  storageRef: {
    name: string;
  };
  schedules?: InstanceBackupSchedule[];
  pitr?: {
    enabled: boolean;
    parameters?: Record<string, unknown>;
  };
}

export interface InstanceBackupConfig {
  enabled: boolean;
  classRef?: {
    name: string;
  };
  storages?: InstanceBackupStorage[];
}

export interface InstanceDataSource {
  type: 'Backup' | 'PointInTime';
  backup?: {
    backupRef: {
      name: string;
    };
  };
  pointInTime?: {
    date?: string;
    recoveryTarget: 'date' | 'latest';
    source: {
      instanceRef: {
        name: string;
      };
      storageRef: {
        name: string;
      };
    };
  };
}

export interface InstanceMaintenance {
  approved?: string;
  autoApproveUpTo?: 'NonDisruptive' | 'RollingRestart' | 'Downtime';
}

export interface InstanceSpec {
  providerRef: {
    name: string;
  };
  version?: string;
  deletionPolicy?: 'Cascade' | 'Orphan';
  topology?: InstanceTopology;
  components?: Record<string, InstanceComponent>;
  backup?: InstanceBackupConfig;
  dataSource?: InstanceDataSource;
  maintenance?: InstanceMaintenance;
  parameters?: Record<string, unknown>;
  userSecretRef?: {
    name: string;
  };
}

export type InstancePhase =
  | 'Pending'
  | 'Provisioning'
  | 'Initializing'
  | 'Ready'
  | 'Updating'
  | 'Terminating'
  | 'Failed'
  | 'Restoring'
  | 'Suspending'
  | 'Suspended'
  | 'Resuming';

export interface InstanceStatusCondition {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime: string;
  reason: string;
  message: string;
  observedGeneration?: number;
}

export interface InstanceComponentStatus {
  state?: string;
  ready?: number;
  total?: number;
  podRefs?: Array<{
    name: string;
  }>;
}

export interface InstanceBackupStorageStatus {
  name: string;
  pitr?: {
    state?: 'Available' | 'Unavailable';
    earliestRestorableTime?: string;
    latestRestorableTime?: string;
    message?: string;
    reason?: string;
  };
}

export interface InstancePendingMaintenanceAction {
  description: string;
  severity: 'NonDisruptive' | 'RollingRestart' | 'Downtime';
  approvalToken?: string;
}

export interface InstanceStatus {
  phase?: InstancePhase;
  version?: string;
  message?: string;
  connectionSecretRef?: {
    name: string;
  };
  conditions?: InstanceStatusCondition[];
  components?: InstanceComponentStatus[];
  backup?: {
    storages?: InstanceBackupStorageStatus[];
  };
  pendingMaintenance?: InstancePendingMaintenanceAction[];
}

export interface InstanceInterface extends KubeObjectInterface {
  spec: InstanceSpec;
  status?: InstanceStatus;
}

export class Instance extends KubeObject<InstanceInterface> {
  static kind = 'Instance';
  static apiName = 'instances';
  static apiVersion = 'core.openeverest.io/v1alpha1';
  static isNamespaced = true;

  get spec(): InstanceSpec {
    return this.jsonData.spec;
  }

  get status(): InstanceStatus | undefined {
    return this.jsonData.status;
  }

  get phase(): InstancePhase {
    return this.status?.phase ?? 'Pending';
  }

  get isReady(): boolean {
    if (this.phase === 'Ready') return true;
    const readyCondition = this.status?.conditions?.find(c => c.type === 'Ready');
    return readyCondition?.status === 'True';
  }

  get message(): string | undefined {
    return this.status?.message;
  }

  get providerName(): string {
    return this.spec?.providerRef?.name || '';
  }

  get engineVersion(): string {
    return this.status?.version || this.spec?.version || '-';
  }

  get topologyType(): string {
    return this.spec?.topology?.type || 'standalone';
  }

  get replicas(): number {
    const engineComp = this.spec?.components?.engine;
    if (engineComp?.replicas !== undefined) {
      return engineComp.replicas;
    }
    const firstComp = Object.values(this.spec?.components || {})[0];
    return firstComp?.replicas ?? 1;
  }

  get storageSize(): string {
    const engineComp = this.spec?.components?.engine;
    return engineComp?.storage?.size || '-';
  }

  get storageClass(): string | undefined {
    const engineComp = this.spec?.components?.engine;
    return engineComp?.storage?.storageClass;
  }

  get connectionSecretName(): string | undefined {
    return this.status?.connectionSecretRef?.name;
  }
}
