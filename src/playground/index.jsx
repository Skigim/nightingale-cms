import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { getComponent } from '../services/registry';
// Side-effect imports to ensure registration
// Business components (side-effect registration)
import '../components/business/FinancialItemCard.jsx';
import '../components/business/FinancialManagementSection.jsx';
import '../components/business/FinancialItemModal.jsx';
import '../components/business/AvsImportModal.jsx';
import '../components/business/CaseCreationModal.jsx';
import '../components/business/NotesModal.jsx';
import '../components/business/CaseDetailsView.jsx';
// UI components required by business components (ensure they register before getComponent calls)
import '../components/ui/Badge.jsx';
import '../components/ui/Button.jsx';
import '../components/ui/Modal.jsx';
import '../components/ui/StepperModal.jsx';
import '../components/ui/FormComponents.jsx';
import '../components/ui/SearchBar.jsx';

function useField(initial) {
  const [value, setValue] = useState(initial);
  return {
    value,
    set: (v) => setValue(v),
    bind: { value, onChange: (e) => setValue(e.target.value) },
  };
}

function ControlGroup({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 4 }}>{label}</span>
      {children}
    </label>
  );
}
ControlGroup.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function ComponentPlayground() {
  // Component selector
  const [selected, setSelected] = useState('FinancialItemCard');

  // Demo fullData + case for CaseDetailsView and related components
  const [fullData, setFullData] = useState(() => ({
    cases: [
      {
        id: 'case-1',
        mcn: 'MCN-2025-001',
        status: 'Pending',
        priority: false,
        retroStatus: false,
        appDetails: { caseType: 'STANDARD' },
        financials: {
          resources: [
            {
              id: 'res-1',
              description: 'Checking Account',
              amount: '2500',
              verificationStatus: 'pending',
              accountNumber: '123456789',
            },
          ],
          income: [
            {
              id: 'inc-1',
              description: 'Employment',
              amount: '4200',
              frequency: 'monthly',
              verificationStatus: 'verified',
              verificationSource: 'Pay Stub',
            },
          ],
          expenses: [
            {
              id: 'exp-1',
              description: 'Rent',
              amount: '1200',
              frequency: 'monthly',
              verificationStatus: 'pending',
            },
          ],
        },
        notes: [
          {
            id: 'n1',
            category: 'General',
            text: 'Initial intake complete.',
            timestamp: Date.now() - 3600_000,
          },
          {
            id: 'n2',
            category: 'Follow-Up',
            text: 'Requested bank statements.',
            timestamp: Date.now() - 600_000,
          },
        ],
      },
    ],
    people: [
      { id: 'person-1', name: 'Jane Doe', firstName: 'Jane', lastName: 'Doe' },
    ],
    organizations: [],
  }));

  const caseId = 'case-1';
  const handleUpdateData = (next) => setFullData(next);
  const noop = () => {};
  const description = useField('Primary Checking');
  const amount = useField('2500');
  const frequency = useField('monthly');
  const verificationStatus = useField('pending');
  const verificationSource = useField('Bank API');
  const accountNumber = useField('123456789');
  const itemType = useField('income');
  const showActions = useField('true');

  const item = useMemo(
    () => ({
      id: 'demo-item-1',
      description: description.value,
      amount: amount.value,
      frequency: frequency.value,
      verificationStatus: verificationStatus.value,
      verificationSource: verificationSource.value,
      accountNumber: accountNumber.value,
      type: itemType.value,
    }),
    [
      description.value,
      amount.value,
      frequency.value,
      verificationStatus.value,
      verificationSource.value,
      accountNumber.value,
      itemType.value,
    ],
  );

  const FinancialItemCard = getComponent('business', 'FinancialItemCard', true);
  const FinancialManagementSection = getComponent(
    'business',
    'FinancialManagementSection',
    true,
  );
  const CaseCreationModal = getComponent('business', 'CaseCreationModal', true);
  const NotesModal = getComponent('business', 'NotesModal', true);
  const CaseDetailsView = getComponent('business', 'CaseDetailsView', true);
  const parsedShowActions = showActions.value === 'true';

  return (
    <div
      style={{
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ width: 300 }}>
        <ControlGroup label="Component">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="FinancialItemCard">FinancialItemCard</option>
            <option value="FinancialManagementSection">
              FinancialManagementSection
            </option>
            <option value="CaseCreationModal">CaseCreationModal</option>
            <option value="NotesModal">NotesModal</option>
            <option value="CaseDetailsView">CaseDetailsView</option>
          </select>
        </ControlGroup>
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Description">
            <input
              {...description.bind}
              placeholder="Description"
            />
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Amount">
            <input
              {...amount.bind}
              placeholder="Amount"
            />
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Frequency">
            <select {...frequency.bind}>
              <option value="">(none)</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="weekly">weekly</option>
              <option value="daily">daily</option>
              <option value="one-time">one-time</option>
            </select>
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Verification Status">
            <select {...verificationStatus.bind}>
              <option value="pending">pending</option>
              <option value="verified">verified</option>
              <option value="unverified">unverified</option>
              <option value="needs-vr">needs-vr</option>
              <option value="vr-pending">vr-pending</option>
              <option value="review-pending">review-pending</option>
              <option value="avs-pending">avs-pending</option>
            </select>
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Verification Source (for verified)">
            <input
              {...verificationSource.bind}
              placeholder="Source"
            />
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Account Number">
            <input
              {...accountNumber.bind}
              placeholder="Account Number"
            />
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Item Type">
            <select {...itemType.bind}>
              <option value="income">income</option>
              <option value="expenses">expenses</option>
              <option value="resources">resources</option>
            </select>
          </ControlGroup>
        )}
        {selected === 'FinancialItemCard' && (
          <ControlGroup label="Show Actions">
            <select {...showActions.bind}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </ControlGroup>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 320 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
          Preview
        </h2>
        <div
          style={{
            background: '#1f2937',
            padding: 16,
            border: '1px solid #374151',
            borderRadius: 8,
          }}
        >
          {selected === 'FinancialItemCard' &&
            (FinancialItemCard ? (
              <FinancialItemCard
                item={item}
                itemType={itemType.value}
                showActions={parsedShowActions}
                confirmingDelete={false}
                onEdit={() => {}}
                onDelete={() => {}}
                onDeleteCancel={() => {}}
                onDeleteConfirm={() => {}}
              />
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                FinancialItemCard not registered.
              </p>
            ))}
          {selected === 'FinancialManagementSection' &&
            (FinancialManagementSection ? (
              <FinancialManagementSection
                caseData={fullData.cases[0]}
                fullData={fullData}
                onUpdateData={handleUpdateData}
              />
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Component missing.
              </p>
            ))}
          {selected === 'CaseCreationModal' &&
            (CaseCreationModal ? (
              <CaseCreationModal
                isOpen={true}
                onClose={noop}
                editCaseId={fullData.cases[0].id}
                fullData={fullData}
                onCaseCreated={handleUpdateData}
              />
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Component missing.
              </p>
            ))}
          {selected === 'NotesModal' &&
            (NotesModal ? (
              <NotesModal
                isOpen={true}
                onClose={noop}
                caseId={fullData.cases[0].id}
                notes={fullData.cases[0].notes}
                onNotesUpdate={(cid, notes) => {
                  const updated = { ...fullData };
                  updated.cases = updated.cases.map((c) =>
                    c.id === cid ? { ...c, notes } : c,
                  );
                  setFullData(updated);
                }}
                caseData={fullData.cases[0]}
                fullData={fullData}
              />
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Component missing.
              </p>
            ))}
          {selected === 'CaseDetailsView' &&
            (CaseDetailsView ? (
              <CaseDetailsView
                caseId={caseId}
                fullData={fullData}
                onUpdateData={handleUpdateData}
                onBackToList={noop}
              />
            ) : (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                Component missing.
              </p>
            ))}
        </div>
        <p
          style={{
            fontSize: 11,
            marginTop: 12,
            lineHeight: 1.4,
            color: '#6b7280',
          }}
        >
          Playground loaded: {selected}. Adjust props where available.
        </p>
      </div>
    </div>
  );
}

function mount() {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  const root = createRoot(rootEl);
  root.render(<ComponentPlayground />);
}

mount();
