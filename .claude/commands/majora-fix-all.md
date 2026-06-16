---
description: Run the full pipeline (new-issue → plan → fix → monitor) for a list of issue IDs, one at a time. After each PR is opened, monitors for user comments or merge before moving on.
argument-hint: "<id1> <id2> ..."
---

You are acting as the Majora **architect**. Run the full issue pipeline for each ID in the queue, one at a time.

All GitHub interactions must go through `.claude/scripts/majora_issue.sh`.
Queue management goes through `.claude/scripts/majora_queue.sh`.

## Arguments received

$ARGUMENTS

## Current queue

!`bash .claude/scripts/majora_queue.sh list 2>/dev/null || echo "(empty)"`

## Steps

### 1. Initialize the queue

Parse the IDs from `$ARGUMENTS` (space-separated). Run:
```
bash .claude/scripts/majora_queue.sh save <id1> <id2> ...
```

---

### 2. Process next issue

#### 2a. Get next ID

```
bash .claude/scripts/majora_queue.sh next
```

If output is empty: all issues are done. Report completion and stop.

#### 2b. Checkout from main

```
bash .claude/scripts/majora_issue.sh checkout-from-main <id>
```

This creates a clean `issue-<id>` branch from the latest `main`.

#### 2c. Create the issue file

Read `.claude/commands/majora-new-issue.md` and follow all its steps for `<id>`.
The final step in that skill commits the issue file.

#### 2d. Create the plan

Read `.claude/commands/majora-plan-issue.md` and follow all its steps for `<id>`.
The final step in that skill commits the plan files.

#### 2e. Open draft PR

```
bash .claude/scripts/majora_issue.sh draft-pr <id>
```

This pushes the branch and opens a draft PR with the committed issue and plan as the description. The PR URL is saved to `.claude/state/<id>_pr.txt`.

#### 2f. Implement and mark ready

Read `.claude/commands/majora-fix-issue.md` and follow all its steps for `<id>`.
Since `.claude/state/<id>_pr.txt` already exists, the final step will call `mark-ready <id>` to convert the draft PR to ready for review.

---

### 3. Monitor the PR

Run:
```
bash .claude/scripts/majora_issue.sh monitor-pr <id>
```

This command **blocks** — it loops internally (5s sleep between checks, retries on error) until the PR is merged, approved, or the owner comments. The first output line is `merged`, `approved`, or `commented`.

---

#### If `merged`

```
bash .claude/scripts/majora_queue.sh pop
```

Go to **Step 2** to process the next issue.

---

#### If `approved`

1. Remove planning artifacts and commit:
   ```
   bash .claude/scripts/majora_issue.sh cleanup-artifacts <id>
   ```
2. Push the cleanup commit:
   ```
   git push
   ```
3. Wait 5 seconds, then check CI status (see **Step 4**).
4. If all checks pass: merge the PR, then pop the queue and go to **Step 2**.

---

#### If `commented`

The lines after the first contain the new comment bodies (one comment per `---` separator).
Only comments from the configured GitHub user are included.

For each comment:

1. Read the comment body carefully.
2. Determine which agent(s) are responsible for the requested change:
   - React, components, frontend, Jasmine specs, CSS → `frontend` agent
   - Django, API, models, migrations, serializers, pytest → `backend` agent
   - Docker, CircleCI, Navi, Tent, Makefile, scripts → `infra` agent
   - Architecture, docs, contracts, root files, cross-cutting → handle yourself as architect
3. Dispatch to the responsible agent(s) in parallel, passing the full comment as the instruction plus:
   - The relevant plan file path
   - The instruction to implement the feedback, run the full dev cycle, and commit
4. If the comment is for you (architect): implement the change yourself and commit.
5. After all agents have committed, push everything:
   ```
   git push
   ```
6. Go back to **Step 3** to resume monitoring.

> **Note:** Only a merge triggers moving to the next issue. Approvals trigger cleanup + merge. Comments always return to monitoring.
