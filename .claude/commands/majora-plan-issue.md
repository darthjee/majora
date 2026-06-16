---
description: Create an implementation plan for a Majora issue. Generates a main plan.md plus individual agent plan files (backend.md, frontend.md, infra.md) for each layer that has work.
argument-hint: "<id>"
---

You are acting as the Majora **architect**. Your job is to produce a complete implementation plan for an issue.

All GitHub interactions must go through `.claude/scripts/majora_issue.sh`.

## Arguments received

$ARGUMENTS

## Existing issues

!`ls docs/agents/issues/ | grep -v '.gitkeep' || echo "(none)"`

## Steps

### 1. Parse the issue ID

Extract the issue ID from `$ARGUMENTS`. Accept formats: `5`, `#5`, `x01`.

### 2. Read the issue file

Run:
```
bash .claude/scripts/majora_issue.sh plan-dir <id>
```
This returns the plan directory path (e.g. `docs/agents/plans/5_my_feature`).

Also read the issue file from `docs/agents/issues/` — find the file matching `<id>_*.md`.

### 3. Explore the codebase

Read the relevant parts of the codebase to understand the current state before planning:
- For backend work: `source/games/models.py`, `source/games/views.py`, `source/games/serializers.py`, `source/games/urls.py`
- For frontend work: `frontend/assets/js/` components and pages relevant to the feature
- For infra work: `docker-compose.yml`, `.circleci/config.yml`, `.circleci/navi_config.yaml`

Only read what is relevant to the issue.

### 4. Determine which agents are involved

Based on the issue and codebase exploration, decide which of these agents have work:
- **backend** — Django models, views, serializers, migrations, tests
- **frontend** — React components, helpers, controllers, Jasmine specs
- **infra** — docker-compose, Dockerfiles, CircleCI, Navi, Tent, scripts

### 5. Identify shared contracts

If more than one agent is involved, identify the shared contracts between them:
- **Backend ↔ Frontend**: API endpoint URLs, JSON payload shape (field names and types), HTTP method
- **Backend ↔ Infra**: new endpoints that must be added to the Navi warm-up chain
- **Frontend ↔ Infra**: build or environment changes

Shared contracts are the single source of truth. Each agent's individual plan will receive a copy of what is relevant to it.

### 6. Create the plan directory and files

Create the directory returned by `plan-dir`. Then create the following files:

---

#### `plan.md` — architect overview

```markdown
# Plan: <title>

Issue: [<id>_<slug>.md](../issues/<id>_<slug>.md)

## Overview

<approach: what will be built and why, in 2–4 sentences>

## Agents involved

- [Backend](backend.md)    ← include only if backend has work
- [Frontend](frontend.md)  ← include only if frontend has work
- [Infra](infra.md)        ← include only if infra has work

## Shared contracts

<API payloads, JSON shapes, endpoint URLs, or any interface that crosses agent boundaries.
Be precise: field names, types, nullable flags, example values.
Omit this section if only one agent is involved.>
```

---

#### `backend.md` — only if backend has work

```markdown
# Backend Plan: <title>

Main plan: [plan.md](plan.md)

## Shared contracts

<copy of the contracts relevant to the backend — API shape it must produce,
endpoint URLs it must expose, etc. Omit if backend works in isolation.>

## Tasks

<ordered list of implementation steps, e.g.:>
1. Add `<field>` to `<Model>` in `models.py`
2. Create migration `<name>`
3. Update `<Serializer>` to expose the new field
4. Add view `<name>` in `views.py`
5. Register URL in `urls.py`
6. Write tests in `tests/models_test.py` and `tests/views_test.py`

## Files

| File | Change |
|------|--------|
| `source/games/models.py` | ... |
| `source/games/serializers.py` | ... |
```

---

#### `frontend.md` — only if frontend has work

```markdown
# Frontend Plan: <title>

Main plan: [plan.md](plan.md)

## Shared contracts

<copy of the contracts relevant to the frontend — API endpoints to call,
expected JSON shape, field names. Omit if frontend works in isolation.>

## Tasks

<ordered list of implementation steps, e.g.:>
1. Add `<method>` to `GenericClient` or create a new client
2. Create controller `<Name>Controller`
3. Create helper `<Name>Helper`
4. Create component `<Name>.jsx`
5. Wire into router / page
6. Write Jasmine specs for each new file

## Files

| File | Change |
|------|--------|
| `frontend/assets/js/...` | ... |
```

---

#### `infra.md` — only if infra has work

```markdown
# Infra Plan: <title>

Main plan: [plan.md](plan.md)

## Shared contracts

<copy of the contracts relevant to infra — new endpoints to add to Navi,
environment variables, Docker changes. Omit if infra works in isolation.>

## Tasks

<ordered list of implementation steps, e.g.:>
1. Add new endpoints to `.circleci/navi_config.yaml` warm-up chain
2. Update `docker-compose.yml` if new services or ports are needed
3. ...

## Files

| File | Change |
|------|--------|
| `.circleci/navi_config.yaml` | ... |
```

---

### 7. Done

Do not ask for confirmation. The plan is complete when all relevant files are written.
