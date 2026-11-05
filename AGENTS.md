# Project workflow

- Implement core behavior in focused modules under `src/core/` and React behavior in `src/react/StringLights.tsx`.
- Keep the JavaScript renderer dependency-free. Share the core through the React package dependency.
- Do not edit generated package bundles, declarations for the React wrapper, or registry payloads directly. Regenerate with `npm run build`.
- Update core declaration contracts and consumer tests when changing the public API.
- Run `npm run check` and inspect real-browser behavior for visual or interaction changes. Keep bundle budgets justified by measurements.
- Use Conventional Commits. Both packages version together through the root Release Please configuration.
- Never commit credentials or publish packages without authorization.
