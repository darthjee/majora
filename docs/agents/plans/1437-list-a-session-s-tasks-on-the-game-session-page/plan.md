# Plan: List a session's tasks on the game session page

Issue: [1437-list-a-session-s-tasks-on-the-game-session-page.md](../../issues/1437-list-a-session-s-tasks-on-the-game-session-page.md)

## Overview
Add a DM-only, self-fetching **Tasks** section to the game session page (`GameSession.jsx`). It lists the first 5 tasks linked to the session through the existing `GET /games/<slug>/tasks.json?session=<id>` endpoint from #1432, supports toggling completion inline and opening `TaskDetailModal`, and shows a **See all** link to the Tasks page pre-filtered by the session. The work is frontend only (no backend, Navi or proxy changes), plus new translation keys.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

New keys under the existing `game_session_page` namespace (`frontend/assets/i18n/{en,pt}/game_session_page.yaml`), consumed by the frontend through `Translator.t('game_session_page.<key>')`:

| Key | en | pt |
|---|---|---|
| `tasks_title` | `Tasks` | `Tarefas` |
| `tasks_loading` | `Loading tasks...` | `Carregando tarefas...` |
| `tasks_empty` | `No tasks for this session.` | `Nenhuma tarefa para esta sessão.` |
| `tasks_error` | `Unable to load tasks.` | `Não foi possível carregar as tarefas.` |
| `tasks_see_all` | `See all ({{count}})` | `Ver todas ({{count}})` |

`tasks_see_all` is interpolated with `count` = the pagination `total`.

The existing `game_tasks_page.view` key is reused by the shared task row. No new key is needed for it.
