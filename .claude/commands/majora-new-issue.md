---
description: Create a new Majora issue file in docs/agents/issues/. Optionally pass a GitHub issue ID to pre-populate from GitHub.
argument-hint: "[#id] Title"
---

You are acting as the Majora **architect**. Your job is to create a new issue file in `docs/agents/issues/`.

All GitHub interactions must go through `.claude/scripts/majora_issue.sh`.

## Arguments received

$ARGUMENTS

## Current state

Existing issues:
!`ls docs/agents/issues/ | grep -v '.gitkeep' || echo "(none)"`

Next numeric ID:
!`bash .claude/scripts/majora_issue.sh next-id`

Next local ID:
!`bash .claude/scripts/majora_issue.sh next-local-id`

## Steps

### 1. Parse arguments

Arguments can be in any of these forms:
- `#5 Title of the issue`
- `5 Title of the issue`
- `#5 - Title of the issue`
- `Title of the issue` (no ID — use next local ID shown above)

Extract:
- `id` — the numeric or x-prefixed ID if provided; otherwise use the next local ID shown above
- `title` — everything that is not the ID prefix

### 2. Fetch GitHub issue (only when a numeric ID was explicitly provided)

If a numeric ID was provided, run:
```
bash .claude/scripts/majora_issue.sh read-github <id>
```
Use the returned `title` and `body` as the starting content for the issue file.
Skip this step entirely if no ID was provided or if the ID is x-prefixed.

### 3. Determine the file path

Run:
```
bash .claude/scripts/majora_issue.sh filename <id> <title>
```

### 4. Write the issue file

Create the file at the path returned in step 3 with this structure:

```markdown
# <title>

## Context

<why this issue exists — problem or opportunity>

## What needs to be done

<concrete description of the work, broken down by layer when applicable:
- Backend: ...
- Frontend: ...
- Infra: ...>

## Acceptance criteria

- [ ] <measurable condition 1>
- [ ] <measurable condition 2>
```

When content came from a GitHub issue, adapt the `body` into this structure rather than copying it verbatim.
When no GitHub content is available, fill in the best description you can infer from the title, leaving acceptance criteria as `- [ ] TODO`.

### 5. Sync to GitHub

Run:
```
bash .claude/scripts/majora_issue.sh write-github <id>
```

The script decides whether to update GitHub or skip — no conditional logic needed here.
