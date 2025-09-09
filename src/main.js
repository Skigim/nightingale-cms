import React from 'react';
import ReactDOM from 'react-dom/client';
import NightingaleCMSApp from './components/business/NightingaleCMSApp.js';
import './index.css';

// Minimal bootstrap: render app directly (React already on window via CDN)
const mount = () => {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(NightingaleCMSApp),
    ),
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

export default NightingaleCMSApp;
