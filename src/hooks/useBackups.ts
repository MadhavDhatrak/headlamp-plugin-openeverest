import { useMemo } from 'react';
import { Backup } from '../crd/Backup';
import { BackupStorage } from '../crd/BackupStorage';

export interface BackupStats {
  total: number;
  succeeded: number;
  running: number;
  pending: number;
  failed: number;
}

export function useBackups(namespace?: string) {
  const [backups, backupError] = Backup.useList(
    namespace ? { namespace } : undefined
  );
  const [backupStorages, storageError] = BackupStorage.useList(
    namespace ? { namespace } : undefined
  );

  const stats = useMemo<BackupStats>(() => {
    if (!backups) {
      return { total: 0, succeeded: 0, running: 0, pending: 0, failed: 0 };
    }

    let succeeded = 0;
    let running = 0;
    let pending = 0;
    let failed = 0;

    for (const b of backups) {
      if (b.isCompleted) {
        succeeded++;
      } else if (b.isRunning) {
        running++;
      } else if (b.isFailed) {
        failed++;
      } else {
        pending++;
      }
    }

    return {
      total: backups.length,
      succeeded,
      running,
      pending,
      failed,
    };
  }, [backups]);

  return {
    backups: backups || [],
    backupStorages: backupStorages || [],
    isLoading:
      (backups === null && !backupError) ||
      (backupStorages === null && !storageError),
    error: backupError || storageError || null,
    stats,
  };
}
