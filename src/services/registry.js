// Dedicated component registry (decoupled from core utilities)
// Provides minimal register/get API to avoid circular dependencies.

const registries = {
  business: {},
  ui: {},
};

export const registerComponent = (registryName, componentName, component) => {
  if (!registryName || !componentName) return;
  const reg = registries[registryName];
  if (!reg) {
    console.error(`Registry "${registryName}" not found.`);
    return;
  }
  reg[componentName] = component;
};

export const getComponent = (registryName, componentName, silent = false) => {
  const reg = registries[registryName];
  if (!reg) {
    if (!silent) {
      console.warn(`Registry "${registryName}" not found.`);
    }
    return null;
  }
  const cmp = reg[componentName];
  if (!cmp) {
    if (!silent) {
      console.warn(
        `Component "${componentName}" not found in registry "${registryName}".`,
      );
    }
    return null;
  }
  return cmp;
};

export const listComponents = (registryName) => {
  const reg = registries[registryName];
  return reg ? Object.keys(reg) : [];
};

export default { registerComponent, getComponent, listComponents };
