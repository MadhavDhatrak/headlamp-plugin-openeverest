const HUB_INDEX_URL =
  'https://raw.githubusercontent.com/openeverest/hub/main/index/index.json';

export interface HubChart {
  channels: Record<string, { ref: string; version: string }>;
  defaultChannel: string;
}

export interface HubPrerequisite {
  name: string;
  description: string;
  installUrl?: string;
}

export interface HubInstall {
  helm?: {
    namespace: string;
    releaseName: string;
  };
  prerequisites?: HubPrerequisite[];
}

export interface HubExtension {
  name: string;
  displayName: string;
  description: string;
  type: 'provider' | 'plugin';
  access: 'public' | 'gated';
  icon: string;
  maturity: 'alpha' | 'beta' | 'stable';
  install?: HubInstall;
  artifacts?: {
    chart?: HubChart;
  };
  homepage: string;
  sourceRepo: string;
  license: string;
  categories: string[];
  keywords: string[];
  maintainers: Array<{
    name: string;
    email?: string;
    github?: string;
  }>;
  verified: boolean;
  health: string;
  provider: {
    providerName: string;
    supportedEngines: string[];
  } | null;
  plugin: {
    contributes: { backend: boolean; cli: boolean; ui: boolean };
    extensionPoints: string[];
  } | null;
  gated?: {
    provider: string;
    contactUrl: string;
    instructions: string;
  };
  compatibility: {
    openeverest?: string;
    kubernetes?: string;
  };
}

export interface HubIndex {
  apiVersion: string;
  kind: string;
  metadata: {
    catalogId: string;
    generatedAt: string;
    schemaVersion: string;
    totalExtensions: number;
  };
  extensions: HubExtension[];
}

let cachedIndex: HubIndex | null = null;
let fetchPromise: Promise<HubIndex> | null = null;

export async function fetchHubIndex(): Promise<HubIndex> {
  if (cachedIndex) return cachedIndex;

  if (!fetchPromise) {
    fetchPromise = fetch(HUB_INDEX_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Hub fetch failed: ${res.status} ${res.statusText}`);
        }
        return res.json() as Promise<HubIndex>;
      })
      .then(data => {
        cachedIndex = data;
        fetchPromise = null;
        return data;
      })
      .catch(err => {
        fetchPromise = null;
        throw err;
      });
  }

  return fetchPromise;
}

export function clearHubCache(): void {
  cachedIndex = null;
  fetchPromise = null;
}

export function buildHelmCommand(ext: HubExtension): string | null {
  const helm = ext.install?.helm;
  const chart = ext.artifacts?.chart;
  if (!helm || !chart) return null;

  const channel = chart.channels[chart.defaultChannel];
  if (!channel) return null;

  return [
    `helm install ${helm.releaseName} \\`,
    `  ${channel.ref} \\`,
    `  --version ${channel.version} \\`,
    `  -n ${helm.namespace} --create-namespace`,
  ].join('\n');
}