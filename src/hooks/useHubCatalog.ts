import { useCallback, useEffect, useState } from 'react';
import { clearHubCache, fetchHubIndex, HubIndex } from '../api/hub';

export interface UseHubCatalogResult {
  catalog: HubIndex | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useHubCatalog(): UseHubCatalogResult {
  const [catalog, setCatalog] = useState<HubIndex | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCatalog = useCallback((forceRefresh = false) => {
    if (forceRefresh) {
      clearHubCache();
    }
    setIsLoading(true);
    setError(null);

    fetchHubIndex()
      .then(data => {
        setCatalog(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const refresh = useCallback(() => {
    loadCatalog(true);
  }, [loadCatalog]);

  return {
    catalog,
    isLoading,
    error,
    refresh,
  };
}
