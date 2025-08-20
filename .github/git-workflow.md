# Git Workflow for Nightingale CMS

## Branch Structure

- **master**: Production-ready code, stable releases
- **development**: Integration branch for new features
- **feature/\***: Individual feature development branches

## Common Commands

### Daily Workflow

```bash
# Check status
git status
git st  # (alias)

# View commit history
git log --oneline --graph --all
git lg  # (alias)

# Switch branches
git checkout dev
git co dev # (alias)

# Create feature branch
git checkout -b feature/new-component
```

### Making Changes

```bash
# Stage changes
git add .
git add specific-file.js

# Commit changes
git commit -m "feat: add new component with validation"
git cm -m "fix: resolve DataTable rendering issue"  # (alias)

# Push changes
git push origin feature/new-component
```

### Merging Features

```bash
# Switch to development
git checkout development

# Merge feature
git merge feature/new-component

# Clean up
git branch -d feature/new-component
```

## Commit Message Conventions

Use conventional commit format for clarity:

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring without behavior changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
git commit -m "feat: add DataTable pagination component"
git commit -m "fix: resolve checkbox selection bug in DataTable"
git commit -m "docs: update component integration guide"
git commit -m "refactor: convert Modal to global window pattern"
git commit -m "style: apply consistent Tailwind spacing"
```

## Project Milestones

### Version 2.0 ✅ (Current)

- Complete ES6 → Global Window migration
- Component library standardization
- DataTable rendering fixes
- PropTypes cleanup

### Version 2.1 (Planned)

- [ ] Enhanced search functionality
- [ ] Component testing framework
- [ ] Performance optimizations
- [ ] Mobile responsive improvements

### Version 2.2 (Future)

- [ ] Multi-user authentication
- [ ] Real-time collaboration
- [ ] Advanced reporting features
- [ ] API integration capabilities

## Release Process

1. **Feature Development**: Work in `feature/*` branches
2. **Integration**: Merge to `development` branch
3. **Testing**: Validate functionality in development
4. **Release**: Merge `development` to `master`
5. **Tag**: Create version tags for releases

```bash
# Create release tag
git tag -a v2.0.0 -m "Release version 2.0.0 - ES6 Migration Complete"
git push origin v2.0.0
```

## Backup Strategy

The repository serves as the primary backup, but also maintain:

- Regular data exports from `Data/nightingale-data.json`
- Component documentation updates
- Configuration file backups

## Emergency Recovery

If you need to restore to a previous version:

```bash
# View available commits
git log --oneline

# Reset to specific commit (careful!)
git reset --hard <commit-hash>

# Or create new branch from old commit
git checkout -b recovery-branch <commit-hash>
```

---

**Remember**: Always commit frequently and use descriptive messages!
