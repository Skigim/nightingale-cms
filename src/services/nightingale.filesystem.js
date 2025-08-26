/**
 * Nightingale FileSystemService - React Framework Compatible
 * 
 * Adapted from the live version to work with the React-based autosave service
 * Uses File System Access API with IndexedDB for persistent directory handles
 */

class NightingaleFileSystemService {
    constructor({
        fileName = "nightingale-data.json",
        errorCallback = console.error,
        sanitizeFn = (str) => str,
        tabId = null,
        dbKey = "nightingaleDirectory"
    } = {}) {
        this.directoryHandle = null;
        this.fileName = fileName;
        this.errorCallback = errorCallback;
        this.sanitizeFn = sanitizeFn;
        this.tabId = tabId;
        this.dbName = "NightingaleFileAccess";
        this.storeName = "directoryHandles";
        this.dbKey = dbKey;
        
        // Initialize by trying to restore previous directory access
        this.initialize();
    }

    async initialize() {
        // Try to restore previous directory access without user interaction
        const { handle, permission } = await this.restoreLastDirectoryAccess();
        if (handle && permission === 'granted') {
            console.log('✅ FileSystemService: Restored directory access with permissions');
        } else {
            console.log('ℹ️ FileSystemService: No previous directory access found or permissions needed');
        }
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
        // Check if we have a directory handle and permissions
        if (!this.directoryHandle) {
            console.log('ℹ️ FileSystemService: No directory selected, save skipped gracefully');
            return false;
        }
        
        const permission = await this.checkPermission();
        if (permission !== "granted") {
            console.log(`ℹ️ FileSystemService: Permission ${permission}, save skipped gracefully`);
            return false;
        }

        try {
            const fileHandleWrite = await this.directoryHandle.getFileHandle(
                this.fileName, { create: true }
            );
            const writable = await fileHandleWrite.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            
            // Store last save timestamp
            localStorage.setItem(
                "nightingale-last-save",
                JSON.stringify({
                    timestamp: new Date().getTime(),
                    tabId: this.tabId,
                })
            );
            return true;
        } catch (err) {
            this.errorCallback(`Error writing file "${this.fileName}": ${err.message}`, "error");
            return false;
        }
    }

    async readFile() {
        if (!this.directoryHandle || (await this.checkPermission()) !== "granted") {
            console.log('ℹ️ FileSystemService: Cannot read file - no directory or permissions');
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
}

// Register the service globally for use by autosave
if (typeof window !== 'undefined') {
    window.NightingaleFileSystemService = NightingaleFileSystemService;
    console.log('✅ NightingaleFileSystemService registered globally');
}
