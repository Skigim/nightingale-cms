/**
 * Case Service - Business logic for case management operations
 * Handles all CRUD operations and business rules for cases
 */

import { Case, OperationResult, FinancialItem } from './types';
import { getDataService } from './dataServiceProvider';
import { generateId, validateEmail, validatePhone } from './utils';

export class CaseService {
  private dataService = getDataService();

  /**
   * Get all cases with optional filtering
   */
  async getAllCases(filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  }): Promise<OperationResult<Case[]>> {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      let filteredCases = [...data.cases];

      // Apply filters
      if (filters) {
        if (filters.status) {
          filteredCases = filteredCases.filter(
            (c) => c.status === filters.status,
          );
        }
        if (filters.priority) {
          filteredCases = filteredCases.filter(
            (c) => c.priority === filters.priority,
          );
        }
        if (filters.assignedTo) {
          filteredCases = filteredCases.filter(
            (c) => c.assignedTo === filters.assignedTo,
          );
        }
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredCases = filteredCases.filter(
            (c) =>
              c.mcn.toLowerCase().includes(searchTerm) ||
              c.clientName.toLowerCase().includes(searchTerm) ||
              c.caseType.toLowerCase().includes(searchTerm),
          );
        }
      }

      // Sort by last update (most recent first)
      filteredCases.sort(
        (a, b) =>
          new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime(),
      );

      return {
        success: true,
        data: filteredCases,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get cases: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get a specific case by ID
   */
  async getCaseById(id: string): Promise<OperationResult<Case | null>> {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      const case_item = data.cases.find((c) => c.id === id);

      return {
        success: true,
        data: case_item || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get case: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get case by MCN (Medicaid Case Number)
   */
  async getCaseByMCN(mcn: string): Promise<OperationResult<Case | null>> {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      const case_item = data.cases.find((c) => c.mcn === mcn);

      return {
        success: true,
        data: case_item || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get case by MCN: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create a new case
   */
  async createCase(
    caseData: Omit<Case, 'id' | 'dateCreated' | 'dateModified' | 'version'>,
  ): Promise<OperationResult<Case>> {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      // Validate required fields
      const validation = this.validateCaseData(caseData);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Check for duplicate MCN
      if (data.cases.some((c) => c.mcn === caseData.mcn)) {
        return {
          success: false,
          error: 'Case with this MCN already exists',
          timestamp: new Date().toISOString(),
        };
      }

      const now = new Date().toISOString();
      const newCase: Case = {
        ...caseData,
        id: generateId('case'),
        dateCreated: now,
        dateModified: now,
        lastUpdate: now,
        version: 1,
      };

      // Add to data
      data.cases.push(newCase);

      // Save changes
      const saveResult = await this.dataService.writeData(data);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        data: newCase,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create case: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update an existing case
   */
  async updateCase(
    id: string,
    updates: Partial<Case>,
  ): Promise<OperationResult<Case>> {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      const caseIndex = data.cases.findIndex((c) => c.id === id);
      if (caseIndex === -1) {
        return {
          success: false,
          error: 'Case not found',
          timestamp: new Date().toISOString(),
        };
      }

      const existingCase = data.cases[caseIndex];

      // Prevent updating system-managed / immutable fields explicitly
      const disallowed = new Set([
        'id',
        'dateCreated',
        'dateModified',
        'lastUpdate',
        'version',
      ] as const);
      const allowedUpdates: Partial<Case> = {};
      Object.entries(updates || {}).forEach(([k, v]) => {
        if (!disallowed.has(k as any) && v !== undefined) {
          (allowedUpdates as any)[k] = v;
        }
      });

      const now = new Date().toISOString();
      const updatedCase: Case = {
        ...existingCase,
        ...allowedUpdates,
        dateModified: now,
        lastUpdate: now,
        version: existingCase.version + 1,
      };

      // Validate updated data
      const validation = this.validateCaseData(updatedCase);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
        };
      }

      // Update in data
      data.cases[caseIndex] = updatedCase;

      // Save changes
      const saveResult = await this.dataService.writeData(data);
      if (!saveResult.success) {
        return saveResult;
      }

      return {
        success: true,
        data: updatedCase,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update case: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Delete a case (soft delete by archiving)
   */
  async deleteCase(id: string): Promise<OperationResult> {
    try {
      return await this.updateCase(id, {
        isArchived: true,
        status: 'closed',
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete case: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Add financial item to case
   */
  async addFinancialItem(
    caseId: string,
    category: 'resources' | 'income' | 'expenses',
    item: Omit<FinancialItem, 'id'>,
  ): Promise<OperationResult<FinancialItem>> {
    try {
      const caseResult = await this.getCaseById(caseId);
      if (!caseResult.success || !caseResult.data) {
        return {
          success: false,
          error: 'Case not found',
          timestamp: new Date().toISOString(),
        };
      }

      const newItem: FinancialItem = {
        ...item,
        id: generateId('financial'),
      };

      const updates: any = {};
      updates[category] = [...caseResult.data[category], newItem];

      const updateResult = await this.updateCase(caseId, updates);
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
          timestamp: updateResult.timestamp,
        };
      }

      return {
        success: true,
        data: newItem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add financial item: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update financial item in case
   */
  async updateFinancialItem(
    caseId: string,
    category: 'resources' | 'income' | 'expenses',
    itemId: string,
    updates: Partial<FinancialItem>,
  ): Promise<OperationResult<FinancialItem>> {
    try {
      const caseResult = await this.getCaseById(caseId);
      if (!caseResult.success || !caseResult.data) {
        return {
          success: false,
          error: 'Case not found',
          timestamp: new Date().toISOString(),
        };
      }

      const items = [...caseResult.data[category]];
      const itemIndex = items.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) {
        return {
          success: false,
          error: 'Financial item not found',
          timestamp: new Date().toISOString(),
        };
      }

      const updatedItem = { ...items[itemIndex], ...updates };
      items[itemIndex] = updatedItem;

      const caseUpdates: any = {};
      caseUpdates[category] = items;

      const updateResult = await this.updateCase(caseId, caseUpdates);
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error,
          timestamp: updateResult.timestamp,
        };
      }

      return {
        success: true,
        data: updatedItem,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update financial item: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStatistics(): Promise<
    OperationResult<{
      total: number;
      byStatus: Record<string, number>;
      byPriority: Record<string, number>;
      totalBudget: number;
      usedBudget: number;
    }>
  > {
    try {
      const data = this.dataService.getCurrentData();
      if (!data) {
        return {
          success: false,
          error: 'Data not available',
          timestamp: new Date().toISOString(),
        };
      }

      const activeCases = data.cases.filter((c) => !c.isArchived);

      const stats = {
        total: activeCases.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        totalBudget: 0,
        usedBudget: 0,
      };

      activeCases.forEach((c) => {
        // Count by status
        stats.byStatus[c.status] = (stats.byStatus[c.status] || 0) + 1;

        // Count by priority
        stats.byPriority[c.priority] = (stats.byPriority[c.priority] || 0) + 1;

        // Sum budgets
        stats.totalBudget += c.totalBudget;
        stats.usedBudget += c.usedBudget;
      });

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get case statistics: ${error}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Private validation methods

  private validateCaseData(caseData: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!caseData.mcn || typeof caseData.mcn !== 'string') {
      errors.push('MCN is required and must be a string');
    }

    if (!caseData.clientName || typeof caseData.clientName !== 'string') {
      errors.push('Client name is required');
    }

    if (
      !caseData.status ||
      !['active', 'pending', 'review', 'completed', 'closed'].includes(
        caseData.status,
      )
    ) {
      errors.push('Valid status is required');
    }

    if (
      !caseData.priority ||
      !['high', 'medium', 'low'].includes(caseData.priority)
    ) {
      errors.push('Valid priority is required');
    }

    if (!caseData.caseType || typeof caseData.caseType !== 'string') {
      errors.push('Case type is required');
    }

    if (
      !caseData.applicationDate ||
      !this.isValidDate(caseData.applicationDate)
    ) {
      errors.push('Valid application date is required');
    }

    if (typeof caseData.totalBudget !== 'number' || caseData.totalBudget < 0) {
      errors.push('Total budget must be a non-negative number');
    }

    if (typeof caseData.usedBudget !== 'number' || caseData.usedBudget < 0) {
      errors.push('Used budget must be a non-negative number');
    }

    if (
      typeof caseData.progress !== 'number' ||
      caseData.progress < 0 ||
      caseData.progress > 100
    ) {
      errors.push('Progress must be a number between 0 and 100');
    }

    // Validate authorized representatives
    if (caseData.authorizedReps && Array.isArray(caseData.authorizedReps)) {
      caseData.authorizedReps.forEach((rep: any, index: number) => {
        if (!rep.name) {
          errors.push(`Authorized rep ${index + 1}: Name is required`);
        }
        if (rep.email && !validateEmail(rep.email)) {
          errors.push(`Authorized rep ${index + 1}: Invalid email format`);
        }
        if (rep.phone && !validatePhone(rep.phone)) {
          errors.push(`Authorized rep ${index + 1}: Invalid phone format`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Singleton instance
let caseServiceInstance: CaseService | null = null;

export const getCaseService = (): CaseService => {
  if (!caseServiceInstance) {
    caseServiceInstance = new CaseService();
  }
  return caseServiceInstance;
};
