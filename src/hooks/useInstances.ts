import { useMemo } from 'react';
import { Instance, InstancePhase } from '../crd/Instance';

export interface InstanceStats {
  total: number;
  ready: number;
  creating: number;
  failed: number;
  suspended: number;
}

export function useInstances(namespace?: string) {
  const [instances, error] = Instance.useList(
    namespace ? { namespace } : undefined
  );

  const stats = useMemo<InstanceStats>(() => {
    if (!instances) {
      return { total: 0, ready: 0, creating: 0, failed: 0, suspended: 0 };
    }

    let ready = 0;
    let creating = 0;
    let failed = 0;
    let suspended = 0;

    for (const inst of instances) {
      const phase = inst.phase;
      const lower = (phase || '').toLowerCase();

      if (inst.isReady) {
        ready++;
      } else if (
        phase === 'Pending' ||
        phase === 'Provisioned' ||
        phase === 'Creating' ||
        phase === 'ApplyingChanges' ||
        phase === 'Restoring' ||
        phase === 'Upgrading' ||
        phase === 'StorageResizing' ||
        phase === 'Scaling'
      ) {
        creating++;
      } else if (
        phase === 'CrashLoopBackOff' ||
        phase === 'ImagePullBackOff' ||
        phase === 'CreateContainerConfigError' ||
        phase === 'Unschedulable' ||
        phase === 'ProviderNotFound' ||
        phase === 'NotResponding' ||
        phase === 'ValidationFailed' ||
        phase === 'ReconcileError' ||
        phase === 'EngineError' ||
        phase === 'Stalled' ||
        phase === 'NeedsAttention' ||
        phase === 'RetriesExhausted' ||
        phase === 'ProgressDeadlineExceeded' ||
        lower.includes('error') ||
        lower.includes('fail') ||
        lower.includes('crash')
      ) {
        failed++;
      } else if (phase === 'Suspended') {
        suspended++;
      } else {
        creating++;
      }
    }

    return {
      total: instances.length,
      ready,
      creating,
      failed,
      suspended,
    };
  }, [instances]);

  return {
    instances: instances || [],
    isLoading: instances === null && !error,
    error,
    stats,
  };
}
