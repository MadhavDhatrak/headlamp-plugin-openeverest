import { useMemo } from 'react';
import { buildHelmCommand, HubExtension } from '../api/hub';
import { PluginResource } from '../crd/Plugin';
import { Provider } from '../crd/Provider';
import { useHubCatalog } from './useHubCatalog';

export interface CatalogExtensionItem {
  extension: HubExtension;
  isInstalled: boolean;
  isReady: boolean;
  installedVersion?: string;
  installedResource?: Provider | PluginResource;
  helmCommand?: string;
}

export interface ExtensionCounts {
  total: number;
  installed: number;
  providers: number;
  plugins: number;
}

export interface UseExtensionsCatalogResult {
  items: CatalogExtensionItem[];
  counts: ExtensionCounts;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useExtensionsCatalog(): UseExtensionsCatalogResult {
  const { catalog, isLoading: isCatalogLoading, error: catalogError, refresh } = useHubCatalog();
  const [providers, providerError] = Provider.useList();
  const [plugins, pluginError] = PluginResource.useList();

  const isLoading = isCatalogLoading || providers === null || plugins === null;
  const error = catalogError || (providerError ? new Error(String(providerError)) : null) || (pluginError ? new Error(String(pluginError)) : null);

  const items = useMemo<CatalogExtensionItem[]>(() => {
    if (!catalog?.extensions) {
      return [];
    }

    const providerList = providers || [];  
    const pluginList = plugins || [];   

    const mapped = catalog.extensions.map(ext => {
      let isInstalled = false;
      let isReady = false;
      let installedVersion: string | undefined;
      let installedResource: Provider | PluginResource | undefined;

      const releaseName = ext.install?.helm?.releaseName;

      if (ext.type === 'provider') {
        const found = providerList.find(
          p =>
            p.metadata.name === ext.name ||
            p.metadata.name === `provider-${ext.name}` ||
            (releaseName && (p.metadata.name === releaseName || p.metadata.name === `provider-${releaseName}`))
        );

        if (found) {
          isInstalled = true;
          isReady = found.isReady;
          installedVersion = found.defaultVersion || found.chartVersion;
          installedResource = found;
        }
      } else if (ext.type === 'plugin') {
        const found = pluginList.find(
          p =>
            p.metadata.name === ext.name ||
            p.metadata.name === `plugin-${ext.name}` ||
            (releaseName && (p.metadata.name === releaseName || p.metadata.name === `plugin-${releaseName}`))
        );

        if (found) {
          isInstalled = true;
          isReady = found.isReady && found.isEnabled;
          installedVersion = found.spec?.version;
          installedResource = found;
        }
      }

      const helmCommand = isInstalled ? undefined : buildHelmCommand(ext);

      return {
        extension: ext,
        isInstalled,
        isReady,
        installedVersion,
        installedResource,
        helmCommand,
      };
    });

    return mapped;
  }, [catalog, providers, plugins]);

  const counts = useMemo<ExtensionCounts>(() => {
    return {
      total: items.length,
      installed: items.filter(i => i.isInstalled).length,
      providers: items.filter(i => i.extension.type === 'provider').length,
      plugins: items.filter(i => i.extension.type === 'plugin').length,
    };
  }, [items]);

  return {
    items,
    counts,
    isLoading,
    error,
    refresh,
  };
  
}
