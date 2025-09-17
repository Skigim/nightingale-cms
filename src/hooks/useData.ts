import { useEffect, useState } from 'react';
// NOTE: With node16/nodenext moduleResolution we must reference the emitted .js extension.
// TypeScript will map these correctly at build time.
import { initData } from './initData.js';
import { getDataService } from '../../project/services/dataServiceProvider.js';

interface BaseResult<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  migrated: boolean;
  refresh: () => Promise<void>;
}

export function useDataInitialization(): BaseResult<any> {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: any;
    migrated: boolean;
  }>({ loading: true, error: null, data: null, migrated: false });

  useEffect(() => {
    let active = true;
    initData().then((r) => {
      if (!active) return;
      if (!r.success) {
        setState((s) => ({
          ...s,
          loading: false,
          error: r.error || 'Initialization failed',
          migrated: false,
        }));
      } else {
        setState({
          loading: false,
          error: null,
          data: r.data,
          migrated: r.migrated,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const ds = getDataService();
      const res = await ds.reloadData();
      if (res.success) {
        setState({
          loading: false,
          error: null,
          data: res.data,
          migrated: false,
        });
      } else {
        setState((s) => ({
          ...s,
          loading: false,
          error: res.error || 'Reload failed',
        }));
      }
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: String(e) }));
    }
  };

  return { ...state, refresh };
}

export function useCases(filter?: (c: any) => boolean): BaseResult<any[]> {
  const base = useDataInitialization();
  const [cases, setCases] = useState<any[] | null>(null);

  useEffect(() => {
    if (base.loading || base.error) return;
    const ds = getDataService();
    const current = ds.getCurrentData();
    if (current) {
      let list = current.cases || [];
      if (filter) list = list.filter(filter);
      setCases(list);
    }
    const unsub = ds.subscribe((d) => {
      let list = d.cases || [];
      if (filter) list = list.filter(filter);
      setCases(list);
    });
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.loading, base.error, filter]);

  return {
    loading: base.loading,
    error: base.error,
    data: cases,
    migrated: base.migrated,
    refresh: base.refresh,
  };
}
