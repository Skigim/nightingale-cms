# Development Guide

## API Documentation (Generated)

API docs are generated locally and not committed to the repository to avoid large, noisy diffs and binary churn.

### Generating API Documentation

To generate API documentation locally:

```bash
npm run docs
```

This will create documentation in the `docs/api/` directory. The generated files are ignored by git to prevent:
- Large binary files (fonts) from being committed
- Noisy diffs from generated HTML content  
- Merge conflicts in generated content

### Rationale

API documentation is generated from JSDoc comments in the source code. While useful for local development and review, committing generated documentation has several drawbacks:

1. **Binary Bloat**: Font files and other assets add unnecessary size to the repository
2. **Noisy Diffs**: Generated HTML creates large, hard-to-review pull requests
3. **Merge Conflicts**: Generated content often conflicts between branches
4. **Outdated Docs**: Committed documentation can become stale if not regenerated

Instead, documentation should be generated as part of:
- Local development workflow
- CI/CD deployment processes  
- Release packaging

### JSDoc Configuration

The project uses JSDoc to generate documentation from inline comments. Configuration is in `jsdoc.json`.

Key settings:
- **Source**: `App/js/` directory (all JavaScript files)
- **Output**: `docs/api/` directory (ignored by git)
- **Include Pattern**: `.js`, `.mjs`, `.cjs` files
- **Exclude Pattern**: Files starting with `_`

### Writing JSDoc Comments

Follow these patterns for consistent documentation:

```javascript
/**
 * Brief description of the function
 * @param {string} name - Parameter description
 * @param {Object} options - Configuration object
 * @param {boolean} options.enabled - Whether feature is enabled
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When validation fails
 * @example
 * const result = await myFunction('test', { enabled: true });
 */
function myFunction(name, options) {
  // Implementation
}
```

For React components:

```javascript
/**
 * Button component with multiple variants
 * @component
 * @param {Object} props - Component props
 * @param {'primary'|'secondary'|'danger'} props.variant - Button style variant
 * @param {string} props.children - Button text content
 * @param {Function} props.onClick - Click handler
 * @example
 * return (
 *   <Button variant="primary" onClick={handleClick}>
 *     Save Changes
 *   </Button>
 * );
 */
function Button({ variant, children, onClick }) {
  // Component implementation
}
```