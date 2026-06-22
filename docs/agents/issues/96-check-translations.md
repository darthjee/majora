# Issue: Check translations

## Description
We need to add a translator agent responsible for maintaining the project's translation files, along with automated verification that translation files stay consistent with each other.

## Problem
- There is no dedicated agent responsible for maintaining translation files.
- There is no verification that all translation files have the same set of keys, so files can drift out of sync silently.

## Expected Behavior
- A translator agent exists and is responsible for keeping translation files up to date and consistent.
- A script verifies that all translation files share the same keys.
- The verification script runs as part of the translator agent's checks.
- The verification script also runs on CI to catch translation drift automatically.

## Solution
- Add a translator agent definition responsible for maintaining translation files.
- Add a script that compares keys across all translation files and fails if they differ.
- Wire the script into the translator agent's check routine.
- Add a CI step that runs the translation check.

## Benefits
- Prevents translation files from drifting out of sync (missing or extra keys).
- Centralizes responsibility for translations under a dedicated agent.
- Catches translation inconsistencies early via CI instead of at runtime.

---
See issue for details: https://github.com/darthjee/majora/issues/96
