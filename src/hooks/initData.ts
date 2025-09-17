// Data initialization bootstrap.
// Responsible for: loading stored data, running legacy migration when needed,
// seeding empty structure, and returning a unified result.
// Keeps side effects (storage/migration) out of UI components.

import { getDataService } from '../../project/services/dataServiceProvider.js';
// We reuse legacy migration detection until ported fully to TS.
// Dynamic import to avoid pulling legacy code into bundle unless needed.

export interface InitResult<T = any> {
  success: boolean;
  data: T | null;
  migrated: boolean;
  migrationReport?: any;
  error?: string;
}

let initPromise: Promise<InitResult> | null = null;

export function initData(): Promise<InitResult> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dataService = getDataService();
    // First attempt normal initialize
    const init = await dataService.initialize();
    if (!init.success) {
      return { success: false, data: null, migrated: false, error: init.error };
    }
    let data = init.data || null;
    if (!data) {
      return { success: true, data: null, migrated: false };
    }

    // Attempt legacy detection (best-effort)
    let migrated = false;
    let migrationReport: any = null;
    try {
      const { detectLegacyProfile } = await import(
        '../../src/services/migration.js'
      );
      const profile = detectLegacyProfile(data as any);
      if (profile.isLegacy) {
        const { runFullMigration } = await import(
          '../../src/services/migration.js'
        );
        const { migratedData, report } = await runFullMigration(data, {
          applyFixes: true,
        });
        migrated = true;
        migrationReport = report;
        // Persist migrated data
        await dataService.writeData(migratedData as any);
        data = migratedData as any;
      }
    } catch (e) {
      // Non-fatal; log diagnostic only
      globalThis.NightingaleLogger?.get('migration')?.warn(
        'migration_bootstrap_failed',
        { error: String(e) },
      );
    }

    return { success: true, data, migrated, migrationReport };
  })();

  return initPromise;
}

export function resetInitDataForTests() {
  initPromise = null;
}
