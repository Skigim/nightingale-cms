/**
 * Nightingale Application Suite - Shared File System Service
 *
 * This file contains the standardized, modular FileSystemService class for handling
 * all file and directory operations using the File System Access API.
 * It uses dependency injection to remain self-contained and reusable.
 */

// Global save lock to prevent concurrent saves across all instances
window._nightingaleGlobalSaveLock = window._nightingaleGlobalSaveLock || false;

class FileSystemService {
    constructor({
        fileName = "nightingale-data.json",
        errorCallback = console.error,
        sanitizeFn = (str) => str,
        tabId,
        dbKey = "nightingaleDirectory"
    }) {
        this.directoryHandle = null;
        this.fileName = fileName;
        this.errorCallback = errorCallback;
        this.sanitizeFn = sanitizeFn;
        this.tabId = tabId;
        this.dbName = "NightingaleFileAccess";
        this.storeName = "directoryHandles";
        this.dbKey = dbKey;
        this.isSaving = false; // Lock to prevent concurrent saves
    }

    isSupported() {
        return "showDirectoryPicker" in window;
    }

    async connect() {
        if (!this.isSupported()) {
            this.errorCallback("File System Access API is not supported in this browser.", "error");
            return false;
        }
        try {
            this.directoryHandle = await window.showDirectoryPicker();
            const permissionGranted = await this.requestPermission();
            if (permissionGranted) {
                await this.storeDirectoryHandle();
            }
            return permissionGranted;
        } catch (err) {
            if (err.name !== "AbortError") {
                console.error("Error selecting directory:", err);
            }
            return false;
        }
    }

    async checkPermission() {
        if (!this.directoryHandle) return "prompt";
        return await this.directoryHandle.queryPermission({ mode: "readwrite" });
    }

    async requestPermission() {
        if (!this.directoryHandle) return false;
        if ((await this.directoryHandle.requestPermission({ mode: "readwrite" })) === "granted") {
            return true;
        }
        this.errorCallback("Permission denied for the stored directory.", "error");
        return false;
    }

    async writeFile(data) {
        // Use global save lock to prevent concurrent saves across all instances
        if (window._nightingaleGlobalSaveLock || this.isSaving) {
            console.warn(`[${this.tabId}] Save operation already in progress (global: ${window._nightingaleGlobalSaveLock}, instance: ${this.isSaving}), skipping duplicate save request`);
            return false;
        }
        
        if (!this.directoryHandle || (await this.checkPermission()) !== "granted") {
            this.errorCallback("Cannot write file: No directory selected or permission not granted.", "error");
            return false;
        }
        
        // Set both locks
        window._nightingaleGlobalSaveLock = true;
        this.isSaving = true;
        
        console.log(`[${this.tabId}] Starting save operation to directory: ${this.directoryHandle.name}`);
        
        try {
            // Validate and repair data before writing to prevent corruption
            const validatedData = this.validateAndRepairData(data);
            
            // Always get a fresh file handle to avoid stale state errors
            const fileHandleWrite = await this.directoryHandle.getFileHandle(
                this.fileName, { create: true }
            );
            
            // Create a new writable stream for this operation
            const writable = await fileHandleWrite.createWritable();
            await writable.write(JSON.stringify(validatedData, null, 2));
            await writable.close();
            
            // Update last save timestamp for multi-tab coordination
            localStorage.setItem(
                "nightingale-last-save",
                JSON.stringify({
                    timestamp: new Date().getTime(),
                    tabId: this.tabId,
                })
            );
            
            console.log(`[${this.tabId}] Save operation completed successfully`);
            
            // Release both locks
            window._nightingaleGlobalSaveLock = false;
            this.isSaving = false;
            return true;
        } catch (err) {
            // If we get a stale state error, try once more with a fresh handle
            if (err.message.includes("state cached in an interface object") || 
                err.message.includes("state had changed")) {
                try {
                    console.warn(`[${this.tabId}] Retrying write with fresh file handle due to stale state`);
                    const freshFileHandle = await this.directoryHandle.getFileHandle(
                        this.fileName, { create: true }
                    );
                    const freshWritable = await freshFileHandle.createWritable();
                    await freshWritable.write(JSON.stringify(validatedData, null, 2));
                    await freshWritable.close();
                    
                    localStorage.setItem(
                        "nightingale-last-save",
                        JSON.stringify({
                            timestamp: new Date().getTime(),
                            tabId: this.tabId,
                        })
                    );
                    
                    console.log(`[${this.tabId}] Save operation completed successfully (after retry)`);
                    
                    // Release both locks
                    window._nightingaleGlobalSaveLock = false;
                    this.isSaving = false;
                    return true;
                } catch (retryErr) {
                    console.error(`[${this.tabId}] Save failed even after retry:`, retryErr.message);
                    // Release both locks
                    window._nightingaleGlobalSaveLock = false;
                    this.isSaving = false;
                    this.errorCallback(`Error writing file "${this.fileName}" (retry failed): ${retryErr.message}`, "error");
                    return false;
                }
            }
            console.error(`[${this.tabId}] Save failed:`, err.message);
            // Release both locks
            window._nightingaleGlobalSaveLock = false;
            this.isSaving = false;
            this.errorCallback(`Error writing file "${this.fileName}": ${err.message}`, "error");
            return false;
        }
    }

    async writeTextFileToSubdirectory(subdirectoryName, fileName, data) {
        if (!this.directoryHandle || (await this.checkPermission()) !== "granted") {
            this.errorCallback("Cannot save file: No directory connected.", "error");
            return false;
        }
        try {
            const dirHandle = await this.directoryHandle.getDirectoryHandle(subdirectoryName, { create: true });
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            return true;
        } catch (err) {
            this.errorCallback(`Error saving file: ${err.message}`, "error");
            return false;
        }
    }

    async readFile() {
        if (!this.directoryHandle || (await this.checkPermission()) !== "granted") {
            this.errorCallback("Cannot read file: No directory selected or permission not granted.", "error");
            return null;
        }
        try {
            const fileHandle = await this.directoryHandle.getFileHandle(this.fileName);
            const file = await fileHandle.getFile();
            const contents = await file.text();
            return JSON.parse(contents);
        } catch (err) {
            if (err.name === "NotFoundError") {
                console.log(`File "${this.fileName}" not found. A new one will be created on the first save.`);
                return null;
            } else {
                this.errorCallback(`Error reading file "${this.fileName}": ${err.message}`, "error");
                throw err;
            }
        }
    }

    async restoreLastDirectoryAccess() {
        if (!this.isSupported()) {
            return { handle: null, permission: "unsupported" };
        }
        try {
            const handle = await this.getStoredDirectoryHandle();
            if (handle) {
                this.directoryHandle = handle;
                const permission = await this.checkPermission();
                return { handle, permission };
            }
        } catch (error) {
            console.error("Error restoring directory access:", error);
            await this.clearStoredDirectoryHandle();
        }
        return { handle: null, permission: "prompt" };
    }

    validateAndRepairData(data) {
        // Basic validation and repair of the data structure
        const repaired = { ...data };
        
        // Ensure required arrays exist
        if (!Array.isArray(repaired.cases)) repaired.cases = [];
        if (!Array.isArray(repaired.people)) repaired.people = [];
        if (!Array.isArray(repaired.organizations)) repaired.organizations = [];
        if (!Array.isArray(repaired.vrRequests)) repaired.vrRequests = [];
        if (!Array.isArray(repaired.vrTemplates)) repaired.vrTemplates = [];
        if (!Array.isArray(repaired.vrCategories)) repaired.vrCategories = [];
        
        // Ensure required objects exist
        if (!repaired.viewState || typeof repaired.viewState !== 'object') {
            repaired.viewState = {};
        }
        if (!repaired.accordionState || typeof repaired.accordionState !== 'object') {
            repaired.accordionState = {};
        }
        
        // Filter out any cases with null/undefined IDs
        repaired.cases = repaired.cases.filter(c => c && c.id !== null && c.id !== undefined);
        
        // Filter out any people with null/undefined IDs
        repaired.people = repaired.people.filter(p => p && p.id !== null && p.id !== undefined);
        
        // Filter out any organizations with null/undefined IDs
        repaired.organizations = repaired.organizations.filter(o => o && o.id !== null && o.id !== undefined);
        
        // Filter out any VRs with invalid case references
        const validCaseIds = new Set(repaired.cases.map(c => c.id));
        repaired.vrRequests = repaired.vrRequests.filter(vr => 
            vr && vr.id !== null && vr.id !== undefined && validCaseIds.has(vr.caseId)
        );
        
        return repaired;
    }

    async getStoredDirectoryHandle() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    resolve(null);
                    return;
                }
                const getRequest = db.transaction(this.storeName).objectStore(this.storeName).get(this.dbKey);
                getRequest.onsuccess = () => resolve(getRequest.result?.handle || null);
                getRequest.onerror = () => resolve(null);
            };
            request.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(this.storeName);
            };
        });
    }

    async storeDirectoryHandle() {
        if (!this.directoryHandle) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onerror = (e) => reject(e);
            request.onsuccess = () => {
                const db = request.result;
                const putRequest = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).put({ handle: this.directoryHandle }, this.dbKey);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = (e) => reject(e);
            };
        });
    }

    async clearStoredDirectoryHandle() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    resolve();
                    return;
                }
                const deleteRequest = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).delete(this.dbKey);
                deleteRequest.onsuccess = () => resolve();
                deleteRequest.onerror = () => resolve();
            };
            request.onerror = () => resolve();
        });
    }

    // Clear ALL cached directory handles (useful for fixing multiple directory issues)
    async clearAllStoredDirectoryHandles() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    resolve();
                    return;
                }
                const transaction = db.transaction(this.storeName, "readwrite");
                const store = transaction.objectStore(this.storeName);
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => {
                    console.log("All cached directory handles cleared");
                    resolve();
                };
                clearRequest.onerror = () => resolve();
            };
            request.onerror = () => resolve();
        });
    }

    // Reset this instance and clear cached handles
    async resetDirectoryAccess() {
        this.directoryHandle = null;
        await this.clearAllStoredDirectoryHandles();
        console.log("Directory access reset - please reconnect to your data folder");
    }

    async openLocalFile(filePath) {
        if (!this.directoryHandle || (await this.checkPermission()) !== "granted") {
            this.errorCallback("Cannot open file: No directory selected or permission denied.", "error");
            return false;
        }
        try {
            const pathParts = filePath.replace(/\\/g, '/').split('/');
            const fileName = pathParts.pop();
            let currentDirectoryHandle = this.directoryHandle;
            for (const part of pathParts) {
                if (part) {
                    currentDirectoryHandle = await currentDirectoryHandle.getDirectoryHandle(part);
                }
            }
            const fileHandle = await currentDirectoryHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const url = URL.createObjectURL(file);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (err) {
            if (err.name === "NotFoundError") {
                this.errorCallback(`File not found: Make sure "${this.sanitizeFn(filePath)}" is in your data directory.`, "error");
            } else {
                this.errorCallback(`Error opening file: ${err.message}`, "error");
            }
            return false;
        }
    }
}