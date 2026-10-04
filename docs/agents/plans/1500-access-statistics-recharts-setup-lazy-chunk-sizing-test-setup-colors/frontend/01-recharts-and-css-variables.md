# Add Recharts and chart CSS variables

Add the dependency with `docker-compose run --rm majora_fe yarn add recharts` (3.x; React 19.2 is supported). Commit both `package.json` and `yarn.lock`.

Add the app's first CSS custom properties: a `:root` block in `main.scss`, right after the SCSS color variables, declaring:

- `--majora-chart-1: #{$secondary-color};`
- `--majora-chart-2: #{$primary-color};`
- `--majora-chart-3` … `--majora-chart-6`: four more distinguishable colors that harmonize with the purple/indigo palette (e.g. teal, amber, rose, slate-blue)
- `--majora-chart-grid` (a light gray, e.g. `#dee2e6`) and `--majora-chart-axis` (e.g. `#6c757d`)

Use SCSS interpolation (`#{...}`) so the custom properties get the compiled values.

## Files to Change
- `frontend/package.json`: add `recharts` ^3
- `frontend/yarn.lock`: lockfile update
- `frontend/assets/css/main.scss`: `:root` block with the `--majora-chart-*` variables
