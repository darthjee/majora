# Plan: Unsafe dynamic import in MajoraLoggerSpec

Issue: [1162-unsafe-dynamic-import-in-majoraloggerspec.md](../../issues/1162-unsafe-dynamic-import-in-majoraloggerspec.md)

## Overview
Resolve the Codacy `no-unsanitized/method` finding on the dynamic `import()` call in `MajoraLoggerSpec.js` by documenting, with a justified inline suppression, why the specifier is safe — the module path is a fixed constant and only a cache-busting query string is dynamic, with no external/user input involved.

See [frontend.md](frontend.md) for the full plan.
