# Plan: Backend tests speed: publish a durations report for every pytest job

Issue: [1787-backend-tests-speed-publish-a-durations-report-for-every-pytest-job.md](../../issues/1787-backend-tests-speed-publish-a-durations-report-for-every-pytest-job.md)

## Overview

Make the three backend pytest CircleCI jobs publish a full durations report, a per-file summary built from JUnit XML by a new script, and the JUnit results themselves; then, from the PR's own pipeline, record the first numbers in the Backend Tests Speed specs. Owned entirely by the `infra` agent.

See [infra.md](infra.md) for the full plan.
