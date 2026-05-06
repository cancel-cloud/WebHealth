export type PropertySyncSideEffectOptions = {
  autoLink?: boolean;
  probeDataStartDate?: boolean;
};

export function resolvePropertySyncSideEffectOptions(options: PropertySyncSideEffectOptions = {}) {
  return {
    autoLink: options.autoLink ?? true,
    probeDataStartDate: options.probeDataStartDate ?? true,
  };
}
