---
description: Run the full pipeline (new-issue → plan → fix → monitor) for a list of issue IDs, one at a time. After each PR is opened, monitors for user comments or merge before moving on.
argument-hint: "<id1> <id2> ... | --continue"
---

You are acting as the Majora **architect**. Run the full issue pipeline for each ID in the queue, one at a time.

All GitHub interactions must go through `.claude/scripts/majora_issue.sh`.
Queue management goes through `.claude/scripts/majora_queue.sh`.

## Arguments received

$ARGUMENTS

## Current queue

!`bash .claude/scripts/majora_queue.sh list 2>/dev/null || echo "(empty)"`

## Steps

### 1. Determine mode

- If `$ARGUMENTS` is `--continue`: skip to **Step 4 — Monitor current PR**.
- Otherwise: proceed with **Step 2**.

---

### 2. Initialize the queue

Parse the IDs from `$ARGUMENTS` (space-separated). Run:
```
bash .claude/scripts/majora_queue.sh save <id1> <id2> ...
```

---

### 3. Process next issue

#### 3a. Get next ID

```
bash .claude/scripts/majora_queue.sh next
```

If output is empty: all issues are done. Report completion and stop.

#### 3b. Checkout from main

```
bash .claude/scripts/majora_issue.sh checkout-from-main <id>
```

This creates a clean `issue-<id>` branch from the latest `main`.

#### 3c. Create the issue file

Read `.claude/commands/majora-new-issue.md` and follow all its steps for `<id>`.
The final step in that skill commits the issue file.

#### 3d. Create the plan

Read `.claude/commands/majora-plan-issue.md` and follow all its steps for `<id>`.
The final step in that skill commits the plan files.

#### 3e. Implement and open PR

Read `.claude/commands/majora-fix-issue.md` and follow all its steps for `<id>`.
The final step in that skill opens a draft PR and saves the PR URL to `.claude/state/<id>_pr.txt`.

---

### 4. Monitor current PR

#### 4a. Get current ID

```
bash .claude/scripts/majora_queue.sh next
```

#### 4b. Check PR status

```
bash .claude/scripts/majora_issue.sh monitor-pr <id>
```

The first line of output is one of: `merged`, `commented`, or `waiting`.

---

#### If `waiting`

Schedule the next check:
```
ScheduleWakeup(delay: 270s, prompt: "/majora-fix-all --continue")
```

---

#### If `merged`

Pop the current ID from the queue:
```
bash .claude/scripts/majora_queue.sh pop
```

Go to **Step 3** to process the next issue.

---

#### If `commented`

The lines after the first contain the new comment body (one comment per `---` separator).
Only comments from the repository owner (`darthjee`) are included.

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
6. Schedule the next monitoring check:
   ```
   ScheduleWakeup(delay: 270s, prompt: "/majora-fix-all --continue")
   ```

> **Note:** Only a merge triggers moving to the next issue. New comments always go back to monitoring.
