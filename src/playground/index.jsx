import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { getComponent } from '../services/registry';
import '../components/business/FinancialItemCard.jsx';

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
        <ControlGroup label="Description">
          <input
            {...description.bind}
            placeholder="Description"
          />
        </ControlGroup>
        <ControlGroup label="Amount">
          <input
            {...amount.bind}
            placeholder="Amount"
          />
        </ControlGroup>
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
        <ControlGroup label="Verification Source (for verified)">
          <input
            {...verificationSource.bind}
            placeholder="Source"
          />
        </ControlGroup>
        <ControlGroup label="Account Number">
          <input
            {...accountNumber.bind}
            placeholder="Account Number"
          />
        </ControlGroup>
        <ControlGroup label="Item Type">
          <select {...itemType.bind}>
            <option value="income">income</option>
            <option value="expenses">expenses</option>
            <option value="resources">resources</option>
          </select>
        </ControlGroup>
        <ControlGroup label="Show Actions">
          <select {...showActions.bind}>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </ControlGroup>
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
          {FinancialItemCard ? (
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
              FinancialItemCard not registered (ensure import present).
            </p>
          )}
        </div>
        <p
          style={{
            fontSize: 11,
            marginTop: 12,
            lineHeight: 1.4,
            color: '#6b7280',
          }}
        >
          Verification badge text and color change automatically with status.
          Frequency suffix hidden for resources.
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
