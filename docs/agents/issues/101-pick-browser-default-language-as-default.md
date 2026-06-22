# Issue: Pick browser default language as default

## Description
When a user has never entered the application (meaning there is no logged-in user information and no stored language preference), the application should default to the language set in the user's browser preferences, instead of always falling back to the hardcoded default (`en`).

## Problem
- `LanguageStorage.getLanguage()` (`frontend/assets/js/i18n/LanguageStorage.js`) returns the hardcoded `DEFAULT_LANGUAGE` (`'en'`) whenever `localStorage.language` is not set.
- `Translator.js` also hardcodes `DEFAULT_LANGUAGE = 'en'`.
- The browser's preferred language (`navigator.language` / `navigator.languages`) is never read anywhere in the codebase.
- As a result, a first-time visitor with no stored preference and no logged-in account always sees the app in English, even if their browser is configured for Portuguese (or any other supported language).

## Expected Behavior
- On first visit (no `localStorage.language` and no logged-in user with a `favorite_language`), the app should inspect the browser's language preference and use it as the initial language, provided it matches one of the supported languages (`en`, `pt`).
- If the browser's language is not one of the supported languages, fall back to the existing hardcoded default (`en`).
- Once a language is explicitly chosen (by the user, or resolved from a logged-in user's `favorite_language`), the existing storage/server-preference behavior continues unchanged.

## Solution
- Update `LanguageStorage.getLanguage()` (or the call site in `Translator.js`) to check `navigator.language`/`navigator.languages` when no stored value exists, matching it against the supported language codes before falling back to `'en'`.
- Keep the `localStorage` guard (for SSR/test environments where `navigator` may also be unavailable).

## Benefits
- Improves first-impression UX for non-English-speaking users by greeting them in their browser's language instead of always defaulting to English.

---
See issue for details: https://github.com/darthjee/majora/issues/101
