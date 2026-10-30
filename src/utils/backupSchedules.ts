import { BackupClass } from '../crd/BackupClass';
import {
  Instance,
  InstanceBackupConfig,
  InstanceBackupSchedule,
  InstanceBackupStorage,
} from '../crd/Instance';

export type ScheduleFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Hourly';

export interface FlattenedSchedule {
  name: string;
  cron: string;
  enabled: boolean;
  storageName: string;
  retentionCopies: number;
  parameters?: Record<string, unknown>;
}

export interface PitrConfig {
  enabled: boolean;
  parameters?: Record<string, unknown>;
}

export type PitrConfigMap = Record<string, PitrConfig>;



export function getCompatibleBackupClasses(
  classes: BackupClass[],
  providerName: string | undefined
): BackupClass[] {
  if (!providerName) return [];
  return classes.filter(bc => {
    if (bc.executionMode !== 'ProviderManaged') return false;
    const supported = bc.supportedProviders;
    if (!supported || supported.length === 0) return false;
    return supported.includes(providerName);
  });
}

export function to24Hour(hour12: number, amPm: 'AM' | 'PM'): number {
  if (amPm === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  }
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function timeToCron(
  frequency: ScheduleFrequency,
  hour12: number,
  minute: number,
  amPm: 'AM' | 'PM',
  weekDay = 1,
  monthDay = 1
): string {
  const h = to24Hour(hour12, amPm);
  const m = minute;

  switch (frequency) {
    case 'Hourly':
      return `${m} * * * *`;
    case 'Daily':
      return `${m} ${h} * * *`;
    case 'Weekly':
      return `${m} ${h} * * ${weekDay}`;
    case 'Monthly':
      return `${m} ${h} ${monthDay} * *`;
    default:
      return `${m} ${h} * * *`;
  }
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function cronToHumanDescription(
  frequency: ScheduleFrequency,
  hour12: number,
  minute: number,
  amPm: 'AM' | 'PM',
  weekDay = 1,
  monthDay = 1
): string {
  const minStr = minute < 10 ? `0${minute}` : `${minute}`;
  const timeStr = `${hour12}:${minStr}${amPm}`;

  switch (frequency) {
    case 'Hourly':
      return `Everest will create a backup of your database every hour, at ${minute} minute${minute === 1 ? '' : 's'} past the hour.`;
    case 'Daily':
      return `Everest will create a backup of your database every day, at ${timeStr}.`;
    case 'Weekly': {
      const dayName = WEEKDAYS[weekDay] || 'Monday';
      return `Everest will create a backup of your database every week on ${dayName}, at ${timeStr}.`;
    }
    case 'Monthly':
      return `Everest will create a backup of your database every month on day ${monthDay}, at ${timeStr}.`;
    default:
      return `Everest will create a backup of your database every day, at ${timeStr}.`;
  }
}

export function parseCronDisplay(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;

  const [min, hour, dom, , dow] = parts;

  if (hour === '*' && dom === '*' && dow === '*') {
    return `Hourly @ :${min.padStart(2, '0')}`;
  }

  const hNum = parseInt(hour, 10);
  const mNum = parseInt(min, 10);
  if (isNaN(hNum) || isNaN(mNum)) return cron;

  const amPm = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
  const timeStr = `${h12}:${mNum.toString().padStart(2, '0')} ${amPm}`;

  if (dom === '*' && dow === '*') {
    return `Daily @ ${timeStr}`;
  }
  if (dom === '*' && dow !== '*') {
    const dayName = WEEKDAYS[parseInt(dow, 10)] || `day ${dow}`;
    return `Weekly (${dayName}) @ ${timeStr}`;
  }
  if (dom !== '*' && dow === '*') {
    return `Monthly (day ${dom}) @ ${timeStr}`;
  }

  return `${cron} (${timeStr})`;
}

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Mondays' },
  { value: 2, label: 'Tuesdays' },
  { value: 3, label: 'Wednesdays' },
  { value: 4, label: 'Thursdays' },
  { value: 5, label: 'Fridays' },
  { value: 6, label: 'Saturdays' },
  { value: 0, label: 'Sundays' },
];

export const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

export const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

export const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export interface ScheduleFormTimeState {
  frequency: ScheduleFrequency;
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
  weekDay: number;
  monthDay: number;
}

export function parseCronToState(cron: string): ScheduleFormTimeState {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      frequency: 'Daily',
      hour: 1,
      minute: 0,
      ampm: 'AM',
      weekDay: 1,
      monthDay: 1,
    };
  }

  const [minPart, hourPart, domPart, , dowPart] = parts;
  const minute = parseInt(minPart, 10) || 0;

  if (hourPart === '*' && domPart === '*' && dowPart === '*') {
    return {
      frequency: 'Hourly',
      hour: 1,
      minute,
      ampm: 'AM',
      weekDay: 1,
      monthDay: 1,
    };
  }

  const hour24 = parseInt(hourPart, 10) || 0;
  const hour = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';

  if (dowPart !== '*') {
    const weekDay = parseInt(dowPart, 10) || 0;
    return {
      frequency: 'Weekly',
      hour,
      minute,
      ampm,
      weekDay,
      monthDay: 1,
    };
  }

  if (domPart !== '*') {
    const monthDay = parseInt(domPart, 10) || 1;
    return {
      frequency: 'Monthly',
      hour,
      minute,
      ampm,
      weekDay: 1,
      monthDay,
    };
  }

  return {
    frequency: 'Daily',
    hour,
    minute,
    ampm,
    weekDay: 1,
    monthDay: 1,
  };
}

export function buildBackupSpecFromWizard(
  schedules: FlattenedSchedule[],
  classRefName?: string,
  pitrMap: PitrConfigMap = {}
): InstanceBackupConfig | undefined {
  if (!schedules.length || !classRefName) {
    return undefined;
  }

  const storageMap = new Map<string, InstanceBackupSchedule[]>();
  for (const s of schedules) {
    const existing = storageMap.get(s.storageName) ?? [];
    existing.push({
      name: s.name,
      cron: s.cron,
      enabled: s.enabled,
      retention: {
        type: 'count',
        count: s.retentionCopies,
      },
      retentionCopies: s.retentionCopies,
      parameters: s.parameters,
    });
    storageMap.set(s.storageName, existing);
  }

  const storages: InstanceBackupStorage[] = Array.from(storageMap.entries()).map(
    ([storageName, storageSchedules]) => {
      const pitrConfig = pitrMap[storageName];
      return {
        storageRef: { name: storageName },
        schedules: storageSchedules,
        ...(pitrConfig?.enabled
          ? {
              pitr: {
                enabled: true,
                ...(pitrConfig.parameters ? { parameters: pitrConfig.parameters } : {}),
              },
            }
          : {}),
      };
    }
  );

  return {
    enabled: true,
    classRef: { name: classRefName },
    storages,
  };
}

export function flattenSchedules(instance: Instance): FlattenedSchedule[] {
  const storages = instance.spec?.backup?.storages ?? [];
  return storages.flatMap(storage =>
    (storage.schedules ?? []).map(schedule => ({
      name: schedule.name,
      cron: schedule.cron,
      enabled: schedule.enabled ?? true,
      storageName: storage.storageRef.name,
      retentionCopies: schedule.retention?.count ?? schedule.retentionCopies ?? 0,
      parameters: schedule.parameters,
    }))
  );
}
