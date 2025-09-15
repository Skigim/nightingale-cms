import React, { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { getComponent, listComponents } from '../services/registry';
import '../components/ui/ErrorBoundary.jsx';
// Dev Playground – FinancialItemCard only.
import '../components/business/FinancialItemCard.jsx';
import '../components/ui/Badge.jsx';
import '../components/ui/Button.jsx';

// (Removed previous local hook helpers after refactor; using centralized store instead)

// --- Simple shared store so controls (in sidebar) and preview (main) stay in sync across two React roots ---
const DEFAULTS = {
  description: 'Primary Checking',
  amount: '2500',
  frequency: 'monthly',
  verificationStatus: 'pending',
  verificationSource: 'Bank API',
  accountNumber: '123456789',
  itemType: 'income',
  showActions: true,
};

const workbenchStore = {
  state: {
    ...DEFAULTS,
    showJson: false,
    componentName: 'FinancialItemCard',
    registryGroup: 'business',
    snapshots: [],
    lastRenderMs: null,
    dirty: false,
  },
  listeners: new Set(),
  set(partial) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  },
  reset() {
    this.set({ ...DEFAULTS });
  },
  randomize() {
    const freqs = ['monthly', 'weekly', 'yearly', 'daily', 'one-time'];
    const statuses = [
      'pending',
      'verified',
      'unverified',
      'needs-vr',
      'vr-pending',
      'review-pending',
      'avs-pending',
    ];
    this.set({
      description: `Acct ${Math.floor(Math.random() * 1000)}`,
      amount: String(Math.floor(Math.random() * 9000) + 100),
      frequency: freqs[Math.floor(Math.random() * freqs.length)],
      verificationStatus: statuses[Math.floor(Math.random() * statuses.length)],
      verificationSource: 'AutoGen',
      accountNumber: String(
        Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000,
      ),
      itemType: ['income', 'expenses', 'resources'][
        Math.floor(Math.random() * 3)
      ],
      showActions: Math.random() > 0.3,
    });
  },
  snapshot() {
    const { snapshots, ...rest } = this.state; // omit lastRenderMs from snapshot
    const snap = {
      id: Date.now().toString(36),
      ts: Date.now(),
      data: { ...rest },
    };
    this.set({ snapshots: [...snapshots, snap] });
  },
  deleteSnapshot(id) {
    this.set({ snapshots: this.state.snapshots.filter((s) => s.id !== id) });
  },
  applySnapshot(id) {
    const snap = this.state.snapshots.find((s) => s.id === id);
    if (snap) this.set({ ...snap.data });
  },
};

function useWorkbenchState() {
  const [data, setData] = useState(workbenchStore.state);
  useEffect(() => {
    const listener = (s) => setData(s);
    workbenchStore.listeners.add(listener);
    return () => workbenchStore.listeners.delete(listener);
  }, []);
  return [data, (partial) => workbenchStore.set(partial)];
}

function WorkbenchControls() {
  const [data, set] = useWorkbenchState();
  const update = (field) => (e) =>
    set({
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  const toggleJson = () => set({ showJson: !data.showJson });
  const components = listComponents(data.registryGroup) || [];
  return (
    <div style={{ fontSize: 12 }}>
      <div
        className="toolbar"
        style={{ marginTop: 0 }}
      >
        <button onClick={() => workbenchStore.reset()}>Reset</button>
        <button onClick={() => workbenchStore.randomize()}>Rand</button>
        <button onClick={() => workbenchStore.snapshot()}>Snap</button>
        <button
          onClick={() =>
            navigator.clipboard?.writeText(JSON.stringify(data, null, 2))
          }
        >
          Copy
        </button>
        <button onClick={toggleJson}>
          {data.showJson ? 'Hide JSON' : 'JSON'}
        </button>
      </div>
      <fieldset
        style={{ border: '1px solid #374151', padding: 8, marginTop: 12 }}
      >
        <legend style={{ fontSize: 11, padding: '0 4px' }}>Component</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Group
          <select
            value={data.registryGroup}
            onChange={(e) => set({ registryGroup: e.target.value })}
          >
            <option value="business">business</option>
            <option value="ui">ui</option>
          </select>
        </label>
        <label style={{ display: 'block' }}>
          Name
          <select
            value={data.componentName}
            onChange={(e) => set({ componentName: e.target.value })}
          >
            {components.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </label>
        <p style={{ fontSize: 10, color: '#6b7280', marginTop: 6 }}>
          Dirty: {data.dirty ? 'yes' : 'no'} • Last render:{' '}
          {data.lastRenderMs ?? '-'}ms
        </p>
      </fieldset>
      {/* Domain Fields (shown only for FinancialItemCard for now) */}
      {data.componentName === 'FinancialItemCard' && (
        <div>
          <label>
            Description
            <input
              value={data.description}
              onChange={update('description')}
            />
          </label>
          <label>
            Amount
            <input
              value={data.amount}
              onChange={update('amount')}
            />
          </label>
          <label>
            Frequency
            <select
              value={data.frequency}
              onChange={update('frequency')}
            >
              <option value="">(none)</option>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
              <option value="weekly">weekly</option>
              <option value="daily">daily</option>
              <option value="one-time">one-time</option>
            </select>
          </label>
          <label>
            Verification Status
            <select
              value={data.verificationStatus}
              onChange={update('verificationStatus')}
            >
              <option value="pending">pending</option>
              <option value="verified">verified</option>
              <option value="unverified">unverified</option>
              <option value="needs-vr">needs-vr</option>
              <option value="vr-pending">vr-pending</option>
              <option value="review-pending">review-pending</option>
              <option value="avs-pending">avs-pending</option>
            </select>
          </label>
          <label>
            Verification Source
            <input
              value={data.verificationSource}
              onChange={update('verificationSource')}
            />
          </label>
          <label>
            Account Number
            <input
              value={data.accountNumber}
              onChange={update('accountNumber')}
            />
          </label>
          <label>
            Item Type
            <select
              value={data.itemType}
              onChange={update('itemType')}
            >
              <option value="income">income</option>
              <option value="expenses">expenses</option>
              <option value="resources">resources</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={data.showActions}
              onChange={update('showActions')}
              style={{ width: 16, height: 16 }}
            />
            Show Actions
          </label>
        </div>
      )}
      {data.showJson && (
        <pre
          style={{
            background: '#111827',
            border: '1px solid #374151',
            padding: 8,
            fontSize: 10,
            lineHeight: 1.4,
            maxHeight: 180,
            overflow: 'auto',
            marginTop: 12,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
      {/* Snapshots */}
      {data.snapshots.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4 style={{ fontSize: 11, margin: '0 0 4px' }}>Snapshots</h4>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxHeight: 120,
              overflow: 'auto',
            }}
          >
            {data.snapshots.map((s) => (
              <li
                key={s.id}
                style={{
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <button
                  style={{ fontSize: 10 }}
                  onClick={() => workbenchStore.applySnapshot(s.id)}
                  title={new Date(s.ts).toLocaleTimeString()}
                >
                  Load
                </button>
                <code
                  style={{
                    fontSize: 10,
                    flex: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.data.componentName}:{s.data.description}
                </code>
                <button
                  style={{ fontSize: 10, color: '#f87171' }}
                  onClick={() => workbenchStore.deleteSnapshot(s.id)}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WorkbenchPreview() {
  const [data, set] = useWorkbenchState();
  const boundaryKey = `${data.registryGroup}:${data.componentName}`;
  const Comp = getComponent(data.registryGroup, data.componentName, true);
  const tRef = useRef(null);
  const startRef = useRef(null);

  // Start timing before render commit
  startRef.current = performance.now();

  useEffect(() => {
    // After paint
    const end = performance.now();
    const dur = Math.round(end - startRef.current);
    set({ lastRenderMs: dur, dirty: false });
  });

  // Derive props for known components (basic heuristic)
  const derivedProps = useMemo(() => {
    if (data.componentName === 'FinancialItemCard') {
      return {
        item: {
          id: 'demo-item-1',
          description: data.description,
          amount: data.amount,
          frequency: data.frequency,
          verificationStatus: data.verificationStatus,
          verificationSource: data.verificationSource,
          accountNumber: data.accountNumber,
          type: data.itemType,
        },
        itemType: data.itemType,
        showActions: data.showActions,
        confirmingDelete: false,
        onEdit: () => {},
        onDelete: () => {},
        onDeleteCancel: () => {},
        onDeleteConfirm: () => {},
      };
    }
    // Fallback: pass no props
    return {};
  }, [data]);

  return (
    <div
      className="card-preview-wrapper"
      ref={tRef}
    >
      <div
        style={{
          border: data.dirty ? '2px dashed #f59e0b' : '1px solid #374151',
          padding: 12,
          borderRadius: 8,
          background: '#1f2937',
          transition: 'border-color 120ms',
        }}
      >
        {Comp ? (
          <React.Suspense fallback={<p style={{ fontSize: 12 }}>Loading…</p>}>
            {React.createElement(
              getComponent('ui', 'ErrorBoundary'),
              { boundaryKey },
              React.createElement(Comp, derivedProps),
            )}
          </React.Suspense>
        ) : (
          <p style={{ fontSize: 12, color: '#9ca3af' }}>
            {data.componentName} not registered in {data.registryGroup}.
          </p>
        )}
      </div>
      <p
        className="note"
        style={{ marginTop: 8 }}
      >
        State is ephemeral. No persistence. ({data.lastRenderMs ?? '-'}ms)
      </p>
    </div>
  );
}

// Small field wrapper for consistent label styling
// Field component retained for potential future styling (not currently used after refactor)
function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginTop: 12 }}>
      <span
        style={{
          display: 'block',
          fontSize: 11,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function mount() {
  const controlsEl = document.getElementById('controls');
  const previewEl = document.getElementById('root');
  if (controlsEl) createRoot(controlsEl).render(<WorkbenchControls />);
  if (previewEl) createRoot(previewEl).render(<WorkbenchPreview />);
}
mount();

// Mark preview dirty on HMR (Vite environment) so user knows component reloaded
if (import.meta?.hot) {
  import.meta.hot.accept(() => {
    workbenchStore.set({ dirty: true });
  });
}
