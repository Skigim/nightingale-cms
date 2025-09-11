/**
 * CaseDetailsView.js - Case details view business component
 *
 * Business component for displaying and managing detailed case information.
 * Provides case editing, notes management, financial tracking, and status updates.
 * Migrated to ES module component registry.
 *
 * @version 1.0.0
 * @author Nightingale CMS Team
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { registerComponent, getComponent } from '../../services/registry';
import { ensureStringId } from '../../services/nightingale.datamanagement.js';

/**
 * CaseDetailsView Component
 * Displays comprehensive case details with editing capabilities
 *
 * @param {Object} props - Component props
 * @param {string} props.caseId - ID of the case to display
 * @param {Object} props.fullData - Complete dataset including cases, people, organizations
 * @param {Function} props.onUpdateData - Callback to update the full dataset
 * @param {Function} props.onBackToList - Callback to navigate back to cases list
 * @param {Object} [props.fileService] - File service for data operations
 * @returns {React.Element} CaseDetailsView component
 */
function CaseDetailsView({
  caseId,
  fullData,
  onUpdateData,
  onBackToList,
  fileService,
}) {
  const e = React.createElement;

  // Component state - must be called unconditionally
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Validate required props
  if (!caseId || !fullData || typeof onUpdateData !== 'function') {
    return null;
  }

  // Data lookups (robust ID matching)
  const caseData = fullData?.cases?.find(
    (c) => ensureStringId(c.id) === ensureStringId(caseId),
  );
  const person =
    globalThis.NightingaleDataManagement?.findPersonById?.(
      fullData?.people,
      caseData?.personId,
    ) || null;
  // TODO: Add spouse and organization display when needed
  // const spouse = caseData?.spouseId ? window.NightingaleDataManagement?.findPersonById?.(fullData?.people, caseData.spouseId) : null;
  // const organization = caseData?.organizationId ? fullData?.organizations?.find((o) => o.id === String(caseData.organizationId || '').padStart(2, '0')) : null;

  // Get component dependencies
  const CaseCreationModal = getComponent('business', 'CaseCreationModal');
  const FinancialManagementSection = getComponent(
    'business',
    'FinancialManagementSection',
  );
  const NotesModal = getComponent('business', 'NotesModal');

  // Update case field helper
  const updateCaseField = (field, value) => {
    if (!caseData) return;

    const updatedCase = { ...caseData, [field]: value };
    const updatedCases = fullData.cases.map((c) =>
      c.id === caseData.id ? updatedCase : c,
    );
    onUpdateData({ ...fullData, cases: updatedCases });
  };

  // Update notes handler
  const handleNotesUpdate = (caseId, updatedNotes) => {
    if (!caseData) return;

    const updatedCase = { ...caseData, notes: updatedNotes };
    const updatedCases = fullData.cases.map((c) =>
      c.id === caseData.id ? updatedCase : c,
    );
    onUpdateData({ ...fullData, cases: updatedCases });
  };

  // Early return if case not found
  if (!caseData) {
    return e(
      'div',
      { className: 'w-full p-8 text-center' },
      e('p', { className: 'text-gray-400 text-lg' }, 'Case not found'),
      onBackToList &&
        e(
          'button',
          {
            onClick: onBackToList,
            className:
              'mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
          },
          'Back to Cases',
        ),
    );
  }

  return e(
    'div',
    { className: 'w-full space-y-6' },

    // Header with Back Button and Case Info (CMSOld styling with background container)
    e(
      'div',
      {
        className:
          'bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-lg',
      },
      e(
        'div',
        { className: 'flex justify-between items-start' },
        e(
          'div',
          {},
          e(
            'h1',
            {
              className:
                'text-3xl font-bold text-blue-300 clickable-header flex items-center gap-x-2 cursor-pointer hover:text-blue-200 transition-colors',
              title: 'Click to edit case details',
              onClick: () => setIsEditModalOpen(true),
            },
            person?.name ||
              [person?.firstName, person?.lastName].filter(Boolean).join(' ') ||
              caseData?.clientName ||
              caseData?.personName ||
              'Unknown',
            ' ',
            e(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                className:
                  'h-5 w-5 text-gray-500 group-hover:text-blue-300 transition-colors',
                viewBox: '0 0 20 20',
                fill: 'currentColor',
              },
              e('path', {
                d: 'M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z',
              }),
              e('path', {
                fillRule: 'evenodd',
                d: 'M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z',
                clipRule: 'evenodd',
              }),
            ),
          ),
          e(
            'p',
            {
              className:
                'text-gray-400 copy-mcn-header cursor-pointer hover:text-blue-400 transition-colors',
              onClick: () =>
                globalThis.NightingaleCMSUtilities?.copyMCN?.(caseData.mcn),
              title: 'Click to copy MCN',
            },
            `MCN: ${caseData.mcn || 'Not set'}`,
          ),
          e(
            'div',
            { className: 'flex items-center gap-4 mt-3' },
            e(
              'div',
              { className: 'flex items-center gap-2' },
              e(
                'select',
                {
                  value: caseData.status || '',
                  onChange: (e) => updateCaseField('status', e.target.value),
                  className:
                    'bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-sm',
                },
                e('option', { value: '' }, '-- No Status --'),
                e('option', { value: 'Pending' }, 'Pending'),
                e('option', { value: 'In Progress' }, 'In Progress'),
                e('option', { value: 'Approved' }, 'Approved'),
                e('option', { value: 'Denied' }, 'Denied'),
                e('option', { value: 'Closed' }, 'Closed'),
              ),
            ),
            e(
              'div',
              { className: 'flex items-center gap-2' },
              e('label', { className: 'text-sm text-gray-400' }, 'Priority:'),
              e('input', {
                type: 'checkbox',
                checked: caseData.priority || false,
                onChange: (e) => updateCaseField('priority', e.target.checked),
                className: 'h-4 w-4 rounded',
              }),
            ),
            e(
              'div',
              { className: 'flex items-center gap-2' },
              e('label', { className: 'text-sm text-gray-400' }, 'Retro:'),
              e('input', {
                type: 'checkbox',
                checked: caseData.retroStatus || false,
                onChange: (e) =>
                  updateCaseField('retroStatus', e.target.checked),
                className: 'h-4 w-4 rounded',
              }),
            ),
          ),
        ),
        e(
          'div',
          { className: 'flex items-center gap-3 self-start pt-8' },
          e(
            'button',
            {
              onClick: () => setIsNotesModalOpen(true),
              className:
                'bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2',
            },
            e(
              'svg',
              {
                xmlns: 'http://www.w3.org/2000/svg',
                className: 'h-4 w-4',
                fill: 'none',
                viewBox: '0 0 24 24',
                stroke: 'currentColor',
              },
              e('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
              }),
            ),
            `Notes (${caseData.notes?.length || 0})`,
          ),
          e(
            'button',
            {
              onClick: () =>
                globalThis.NightingaleCMSUtilities?.generateCaseSummary?.(
                  caseData,
                ),
              className:
                'bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md',
            },
            'Generate Summary',
          ),
          e(
            'button',
            {
              onClick: () =>
                globalThis.NightingaleCMSUtilities?.openVRApp?.(caseData),
              className:
                'bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md',
            },
            'Open VR App',
          ),
        ),
      ),
    ),

    // Financial Management Section
    FinancialManagementSection &&
      e(FinancialManagementSection, { caseData, fullData, onUpdateData }),

    // Notes Modal
    NotesModal &&
      e(NotesModal, {
        isOpen: isNotesModalOpen,
        onClose: () => setIsNotesModalOpen(false),
        caseId: caseData.id,
        notes: caseData.notes || [],
        onNotesUpdate: handleNotesUpdate,
        caseData: caseData,
        fullData: fullData,
      }),

    // Edit Case Modal
    isEditModalOpen &&
      CaseCreationModal &&
      e(CaseCreationModal, {
        isOpen: isEditModalOpen,
        onClose: () => setIsEditModalOpen(false),
        editCaseId: caseData.id,
        fullData,
        fileService,
        onViewCaseDetails: () => {
          setIsEditModalOpen(false);
          // Rely on parent callbacks if provided via props
          if (typeof onBackToList === 'function') {
            // no-op here; parent controls navigation
          }
          // Local navigation fallback
          // Consumers should pass a handler to switch to details view; otherwise, do nothing
        },
        onCaseCreated: (updatedCaseData) => {
          onUpdateData(updatedCaseData);
          setIsEditModalOpen(false);
        },
      }),
  );
}

// PropTypes for validation

// Self-registration for both module and script loading
// Register with business registry (legacy global removal)
registerComponent('business', 'CaseDetailsView', CaseDetailsView);

// Export for ES6 module compatibility

// ES6 Module Export
export default CaseDetailsView;

CaseDetailsView.propTypes = {
  caseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  fullData: PropTypes.object.isRequired,
  onUpdateData: PropTypes.func.isRequired,
  onBackToList: PropTypes.func,
  fileService: PropTypes.object,
};
