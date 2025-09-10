// Minimal compatibility shim to support existing imports expecting .js extension
export { default } from './TabBase.jsx';
export {
  createBusinessComponent,
  getRegistryComponent,
  resolveComponents,
  FallbackModal,
  FallbackButton,
  FallbackSearchBar,
  SearchSection,
  ContentSection,
} from './TabBase.jsx';
