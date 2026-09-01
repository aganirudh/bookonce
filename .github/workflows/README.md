# Repository quality workflow

`quality.yml` runs on pull requests and pushes to `main` or `master`. It installs the lockfile with `npm ci`, then runs TypeScript, ESLint, the complete Vitest suite, deterministic AI evaluations, and the production build. No Gemini or other private credential is required.

Run the same checks locally with:

```bash
npm run typecheck
npm run lint
npm test
npm run eval
npm run build
```
