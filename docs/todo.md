# Nightingale CMS - Code Review Action Items

## High Priority (Do First)

### Security & Error Handling

- [ ] **Fix HTML sanitizer** - Current cleaner is too weak, add strict filtering for scripts/events
- [ ] **Replace silent errors with logging** - Stop ignoring failures, write them to debug log instead
- [ ] **Add input length limits** - Prevent oversized data from crashing parsers/clipboard

### Performance Quick Wins

- [ ] **Cache currency formatter** - Create once, reuse instead of making new one each time
- [ ] **Fix deep cloning in migrations** - Process large datasets in chunks to avoid UI freezing

## Medium Priority (Do Second)

### Code Organization

- [ ] **Reorganize validators** - Group into Validation._, Format._, Sanitize.\* namespaces
- [ ] **Phase out legacy globals** - Mark old function names as deprecated, plan removal
- [ ] **Standardize argument checking** - All exported functions should validate inputs consistently

### Documentation

- [ ] **Logger quick start guide** - How to enable transports and use structured logging
- [ ] **HTML sanitization policy** - Document what's allowed vs blocked
- [ ] **Migration strategy guide** - How data upgrades work and performance considerations

## Lower Priority (Nice to Have)

### Advanced Security

- [ ] **URL opener validation** - Whitelist allowed destinations for cross-tab navigation
- [ ] **Account masking improvements** - Better encryption when user accounts are built
- [ ] **Add security headers documentation** - CSP and other server-level protections

### Performance Tuning

- [ ] **Optimize search service** - Debounce large dataset updates
- [ ] **Add performance monitoring** - Track migration times and buffer usage

## Completed ✅

- [x] Remove console logging across codebase
- [x] Add structured logger scaffold
- [x] Clean up lint warnings

## Notes

- Items marked with GitHub issues: #18 (clipboard limits), #19 (account masking), #20 (argument validation), #21 (legacy exports), #22 (JSDoc), #23 (currency formatting)
- React handles most XSS via JSX - current HTML helpers are for manual DOM manipulation only
- Financial parsing migration to IBM BACA service planned for later
- Web Crypto API implementation scheduled with user accounts feature

---

_Last updated: August 27, 2025_
