/**
 * Data Service Provider - Core data persistence abstraction
 * This service abstracts all data I/O operations and provides the foundation
 * for the entire data management system.
 */

import { ApplicationData, ServiceConfig, OperationResult } from './types';

export class DataServiceProvider {
  private config: ServiceConfig;
  private data: ApplicationData | null = null;
  private listeners: Array<(data: ApplicationData) => void> = [];

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize the data service and load existing data
   */
  async initialize(): Promise<OperationResult<ApplicationData>> {
    try {
      const result = await this.readData();
      if (result.success && result.data) {
        this.data = result.data;
      } else {
        // Initialize with empty data structure
        this.data = this.createEmptyDataStructure();
        if (this.config.storage.autoSave) {
          await this.writeData(this.data);
        }
      }

      return {
        success: true,
        data: this.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize data service: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Read the complete application dataset
   */
  async readData(): Promise<OperationResult<ApplicationData>> {
    try {
      const rawData = this.getStorageData();

      if (!rawData) {
        return {
          success: false,
          error: 'No data found in storage',
          timestamp: new Date().toISOString(),
        };
      }

      const parsedData = JSON.parse(rawData) as ApplicationData;

      // Basic validation
      if (!this.validateDataStructure(parsedData)) {
        return {
          success: false,
          error: 'Invalid data structure found',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: parsedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read data: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Write the complete application dataset
   */
  async writeData(data: ApplicationData): Promise<OperationResult> {
    try {
      // Validate data before writing
      if (!this.validateDataStructure(data)) {
        return {
          success: false,
          error: 'Invalid data structure provided',
          timestamp: new Date().toISOString(),
        };
      }

      // Update metadata
      data.metadata = {
        ...data.metadata,
        lastBackup: new Date().toISOString(),
        totalEntities:
          data.cases.length + data.people.length + data.organizations.length,
      };

      const serializedData = JSON.stringify(data, null, 2);
      this.setStorageData(serializedData);

      // Update internal cache
      this.data = data;

      // Notify listeners
      this.notifyListeners(data);

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write data: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get current data (from cache if available)
   */
  getCurrentData(): ApplicationData | null {
    return this.data;
  }

  /**
   * Force reload data from storage
   */
  async reloadData(): Promise<OperationResult<ApplicationData>> {
    this.data = null;
    return await this.initialize();
  }

  /**
   * Create backup of current data
   */
  async createBackup(): Promise<OperationResult<string>> {
    try {
      if (!this.data) {
        return {
          success: false,
          error: 'No data available to backup',
          timestamp: new Date().toISOString(),
        };
      }

      const backupKey = `${this.config.storage.key}_backup_${Date.now()}`;
      const backupData = JSON.stringify(this.data);

      localStorage.setItem(backupKey, backupData);

      return {
        success: true,
        data: backupKey,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create backup: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(backupKey: string): Promise<OperationResult> {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found',
          timestamp: new Date().toISOString(),
        };
      }

      const parsedData = JSON.parse(backupData) as ApplicationData;
      return await this.writeData(parsedData);
    } catch (error) {
      return {
        success: false,
        error: `Failed to restore backup: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Subscribe to data changes
   */
  subscribe(listener: (data: ApplicationData) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    usedSpace: number;
    availableSpace: number;
    backupCount: number;
  } {
    const keys = Object.keys(localStorage);
    const dataKeys = keys.filter((key) =>
      key.startsWith(this.config.storage.key),
    );

    let usedSpace = 0;
    dataKeys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        usedSpace += value.length;
      }
    });

    const backupCount = keys.filter((key) =>
      key.startsWith(`${this.config.storage.key}_backup_`),
    ).length;

    return {
      usedSpace,
      availableSpace: 5 * 1024 * 1024 - usedSpace, // 5MB typical localStorage limit
      backupCount,
    };
  }

  /**
   * Clean up old backups
   */
  cleanupBackups(keepCount: number = 5): number {
    const keys = Object.keys(localStorage);
    const backupKeys = keys
      .filter((key) => key.startsWith(`${this.config.storage.key}_backup_`))
      .sort()
      .reverse(); // Most recent first

    const toDelete = backupKeys.slice(keepCount);
    toDelete.forEach((key) => localStorage.removeItem(key));

    return toDelete.length;
  }

  // Private methods

  private getStorageData(): string | null {
    switch (this.config.storage.provider) {
      case 'localStorage':
        return localStorage.getItem(this.config.storage.key);
      case 'memory':
        // For testing purposes
        return (window as any).__nightingale_memory_storage || null;
      default:
        throw new Error(
          `Unsupported storage provider: ${this.config.storage.provider}`,
        );
    }
  }

  private setStorageData(data: string): void {
    switch (this.config.storage.provider) {
      case 'localStorage':
        localStorage.setItem(this.config.storage.key, data);
        break;
      case 'memory':
        // For testing purposes
        (window as any).__nightingale_memory_storage = data;
        break;
      default:
        throw new Error(
          `Unsupported storage provider: ${this.config.storage.provider}`,
        );
    }
  }

  private validateDataStructure(data: any): data is ApplicationData {
    return (
      typeof data === 'object' &&
      Array.isArray(data.cases) &&
      Array.isArray(data.people) &&
      Array.isArray(data.organizations) &&
      typeof data.metadata === 'object'
    );
  }

  private createEmptyDataStructure(): ApplicationData {
    return {
      cases: [],
      people: [],
      organizations: [],
      metadata: {
        version: '2.1.4',
        lastBackup: new Date().toISOString(),
        totalEntities: 0,
        schemaVersion: 1,
      },
    };
  }

  private notifyListeners(data: ApplicationData): void {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }
}

// Create default configuration
export const createDefaultConfig = (): ServiceConfig => ({
  storage: {
    provider: 'localStorage',
    key: 'nightingale_cms_data',
    autoSave: true,
    backupInterval: 3600000, // 1 hour
  },
  search: {
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
  },
  validation: {
    strictMode: false,
    allowPartialUpdates: true,
  },
});

// Singleton instance
let dataServiceInstance: DataServiceProvider | null = null;

export const getDataService = (): DataServiceProvider => {
  if (!dataServiceInstance) {
    dataServiceInstance = new DataServiceProvider(createDefaultConfig());
  }
  return dataServiceInstance;
};
