// Central feature flag access.
// Using Vite import.meta.env for build-time flags; fallback to defaults.
// Big Bang UI migration flag.

export const featureFlags = {
  uiShellV2: (import.meta as any).env?.VITE_UI_SHELL === 'true',
};

export function isUiShellV2Enabled() {
  return featureFlags.uiShellV2;
}
