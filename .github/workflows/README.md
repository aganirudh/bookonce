# GitHub Actions Workflows

This directory contains automated workflows for code quality checks.

## Workflows

### 1. 🔍 Lint Workflow (`lint.yml`)
- **Runs:** ESLint on TypeScript/React code
- **Triggers:** Pull requests and pushes to main branch
- **Purpose:** Catches bugs, errors, and enforces coding standards

### 2. 💅 Format Workflow (`format.yml`)
- **Runs:** Prettier formatting checks
- **Triggers:** Pull requests and pushes to main branch
- **Purpose:** Ensures consistent code formatting across the project

## Local Development

### Run linter locally:
```bash
npm run lint
```

### Check formatting locally:
```bash
npm run format:check
```

### Auto-fix formatting:
```bash
npm run format
```

## CI/CD Process

1. **On Pull Request:** Both workflows run automatically
2. **On Push to Main:** Both workflows run to ensure main branch is clean
3. **Status Checks:** PRs can only be merged if all checks pass

## Configuration Files

- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files to exclude from formatting
- `eslint.config.js` - ESLint rules and settings

## What Gets Checked

✅ TypeScript/JavaScript syntax and best practices  
✅ React hooks rules  
✅ Code formatting consistency  
✅ Import statements organization  
✅ Unused variables and dead code  

---

**🎯 Goal:** Keep codebase clean, consistent, and error-free!
