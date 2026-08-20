# `HeaderHelper.jsx`: title/sub-title from config

Replace the two i18n calls in `HeaderHelper.render()` (`frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx:165-168`):

```jsx
<Navbar.Brand href="#/">
  {Translator.t('header.title')}
  <small className="d-block text-muted">{Translator.t('header.subtitle')}</small>
</Navbar.Brand>
```

with the `title`/`sub_title` values from the domain config fetched in step 01 (passed down as a prop from `HeaderController`, matching how other bootstrap-derived data already reaches `HeaderHelper`). Since the API always resolves `title`/`sub_title` to a real string (defaulting server-side to `"Majora"`/`"RPG"`), no client-side null-handling is needed here — just render the string as given. `""` naturally renders as empty, matching the existing `sub-title` "when `""` shows nothing" behavior.

## Files to Change

- `frontend/assets/js/components/common/header/helpers/HeaderHelper.jsx` — read `title`/`sub_title` from props instead of `Translator.t(...)`
