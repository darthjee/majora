---
description: Implement a planned Majora issue. The architect reads the plan, runs specialist agents in parallel, reviews the result, and opens a draft PR.
argument-hint: "<id>"
---

You are acting as the Majora **architect**. Your job is to coordinate implementation of a planned issue and open a draft PR when done.

All GitHub interactions must go through `.claude/scripts/majora_issue.sh`.

## Arguments received

$ARGUMENTS

## Existing plans

!`ls docs/agents/plans/ | grep -v '.gitkeep' || echo "(none)"`

## Steps

### 1. Parse the issue ID

Extract the issue ID from `$ARGUMENTS`. Accept formats: `5`, `#5`, `x01`.

### 2. Create the branch

Run:
```
bash .claude/scripts/majora_issue.sh create-branch <id>
```

This reads the branch name from `## Branch` in `plan.md`, or falls back to `issue-<id>`. All subsequent work happens on this branch.

### 3. Read the plan

Run:
```
bash .claude/scripts/majora_issue.sh plan-dir <id>
```

Read `plan.md` from the returned directory. Identify which agent plans exist alongside it (`backend.md`, `frontend.md`, `infra.md`).

### 4. Run specialist agents in parallel

Launch one Agent per plan file that exists, all at the same time. Pass each agent:
- The path to their plan file
- The instruction below

**Instruction to each specialist agent:**

> Read your plan file at `<path>`. Implement everything described in it.
> Follow the development cycle:
> 1. Implement
> 2. Run tests and lint fix (using the commands in your agent instructions)
> 3. Analyze whether refactoring is needed — if so, refactor and repeat from step 2
> 4. When clean: `git add` your changes, then commit them by running the helper script — never write the commit message by hand:
>    ```
>    bash .claude/scripts/majora_issue.sh commit <type> <scope> <id> "<subject>" <agent> "<AI model name>" "<AI model email>" "<optional body>"
>    ```
>    - `<type>`: `feat`, `fix`, `refactor`, `docs`, `test`, or `chore`
>    - `<scope>`: your layer (`backend`, `frontend`, or `infra`)
>    - `<id>`: the issue number
>    - `<agent>`: your agent role (`backend`, `frontend`, or `infra`)
>    - `<AI model name>` and `<AI model email>`: the model you are running on and its canonical noreply email (e.g. `Claude Sonnet 4.6` / `noreply@anthropic.com`)
>    - The script builds the message from the template at `.github/commit_message_template.md` and runs `git commit` for you. Omit the trailing body argument if there is none.
>
> Do not ask for confirmation. Report back with: what you implemented, what files you changed, and whether all checks passed.

Use the correct subagent type for each plan file:
- `backend.md` → `subagent_type: backend`
- `frontend.md` → `subagent_type: frontend`
- `infra.md` → `subagent_type: infra`

### 5. Review the results

When all agents report back:
- Read the changed files to verify the implementation matches the plan
- Check that each agent confirmed all tests and lint passed
- Verify that shared contracts (API shape, payload, URLs) are consistently implemented across layers

If anything is wrong or missing, send the relevant agent back to fix it (step 3, single agent this time). Repeat until the implementation is correct and complete.

### 6. Publish the PR

When the implementation is correct and all agents have committed their work:

Push all commits:
```
git push
```

If `.claude/state/metadata/issue_<id>.json` already has a `pr_url` (a draft PR was opened earlier):
```
bash .claude/scripts/majora_issue.sh mark-ready <id>
```
This marks the existing draft PR as ready for review.

Otherwise (no PR yet):
```
bash .claude/scripts/majora_issue.sh draft-pr <id>
```
This pushes the current branch and opens a draft PR.

Report the PR URL.
