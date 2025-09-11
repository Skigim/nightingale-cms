// Debug script to check registry state
import { listComponents } from './src/services/registry.js';

// Import all business components to trigger registration
import './src/components/business/PersonCreationModal.jsx';
import './src/components/business/CaseCreationModal.jsx';
import './src/components/business/OrganizationModal.jsx';
import './src/components/business/NotesModal.jsx';

console.log('UI Registry components:', listComponents('ui'));
console.log('Business Registry components:', listComponents('business'));
