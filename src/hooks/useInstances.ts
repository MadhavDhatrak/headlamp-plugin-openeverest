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
      if (inst.isReady) {
        ready++;
      } else if (
        inst.phase === 'Provisioning' ||
        inst.phase === 'Pending' ||
        inst.phase === 'Initializing'
      ) {
        creating++;
      } else if (inst.phase === 'Failed') {
        failed++;
      } else if (inst.phase === 'Suspended' || inst.phase === 'Suspending') {
        suspended++;
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
