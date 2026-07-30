## Directory Structure

```
frontend/
  assets/
    css/
      styles.css          # custom CSS
      main.scss           # custom SCSS
    js/
      client/             # HTTP API clients
      components/
        App.jsx             # app shell (lives at components root)
        AppController.js    # app shell controller (lives at components root)
        helpers/            # AppHelper.jsx (page-key -> component wiring, lives at components root)
        resources/          # one folder per resource — see "Directory Structure" below
          game/
            pages/             # top-level route components for this resource
              controllers/     # page controllers (.js)
              helpers/         # page JSX helpers (.jsx)
              elements/        # elements used only by this resource's pages
                controllers/   # element controllers (.js)
                helpers/       # element JSX helpers (.jsx)
          game_session/
            pages/ ...
          character/
            pages/ ...
          treasure/
            pages/ ...
          staff_user/
            pages/ ...
          account/
            LoginModal.jsx     # not a routed page (opened from the header), so it sits
            controllers/       # alongside pages/ instead of inside it
            helpers/
            pages/ ...
        common/              # elements shared across more than one resource, grouped by theme
          base/                # shared base classes not tied to one component
            controllers/         # e.g. BasePageController, BaseEditController
          buttons/             # BackButton, EditButton, LoadMoreButton, NewButton, ...
          modals/              # MoneyEditModal, PhotoUploadModal, ...
          cards/               # CardAvatar, CardPhoto, CharacterPreviewCard, ...
          badges/              # Badge, InfoBadgeList, TooltipBadge
          forms/               # FieldErrors, FormField, TextareaField
          header/              # Header + its controllers/helpers
          pagination/          # Pagination, PageLink + their controllers/helpers
          list_page/           # ListPage, PageActions + their controller/helper
          list_types/          # per-resource list item components/configs (unchanged)
          misc/                # standalone shared elements (ActionBar, Avatar, ErrorAlert, ...)
          # each theme folder above has its own controllers/ and helpers/ sub-folders
          # when it has files for those (no empty sub-folders)
      i18n/                # translation singleton, storage, and events (.js)
      utils/              # non-JSX utility classes (.js)
      main.jsx            # SPA entry point
    i18n/                 # bundled YAML translation files (en.yaml, ...)
  specs/                  # Jasmine tests (mirror assets/js/ structure)
  index.html
  package.json
  vite.config.js
  eslint.config.mjs
```

Each resource folder under `components/resources/` colocates every page, controller, and helper
used only by that resource (e.g. `resources/game/pages/Games.jsx`,
`resources/game/pages/controllers/GamesController.js`,
`resources/game/pages/helpers/GamesHelper.jsx`, and — for elements used only by `game` pages —
`resources/game/pages/elements/GameCard.jsx` with its own `controllers/`/`helpers/`
sub-folders). The six resources are `game`, `game_session`, `character` (covers both NPC and PC
pages), `treasure`, `staff_user`, and `account` (my-account, register, recover-password, login).

Anything genuinely shared across more than one resource (or used by the app shell itself, like
`Header.jsx`) lives under `components/common/`, grouped into themed subfolders (`buttons/`,
`modals/`, `cards/`, `badges/`, `forms/`, `header/`, `pagination/`, `list_page/`, `list_types/`,
`misc/`, `base/`), each with its own `controllers/` and `helpers/` sub-folders when it has files
for those — e.g. `common/pagination/Pagination.jsx`, `common/forms/FormField.jsx`,
`common/base/controllers/BasePageController.js`. `App.jsx`, `AppController.js`, and
`helpers/AppHelper.jsx` stay at the `components/` root and import from `resources/<resource>/`
and `common/` as needed. `utils/` (non-JSX utility classes) is untouched by the resource split.

See [Frontend i18n](i18n.md) for the translation layer (`Translator`,
`LanguageStorage`, `LanguageEvents`, and the header language selector).

