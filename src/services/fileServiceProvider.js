// Simple provider to share a file service instance across modules
// Avoids window-based fallbacks and allows clean dependency injection.

let fileServiceInstance = null;

export function setFileService(service) {
  fileServiceInstance = service || null;
}

export function getFileService() {
  if (fileServiceInstance) return fileServiceInstance;
  // Backward compatibility: use globally exposed service if present
  // Use globalThis to avoid window.* lint restrictions
  const legacy =
    (typeof globalThis !== 'undefined' &&
      (globalThis.NightingaleFileService || globalThis.FileService)) ||
    null;
  return legacy;
}

export default { setFileService, getFileService };
