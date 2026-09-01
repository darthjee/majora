# Basic headless cache warm-up

Warm a fixed list of URLs against one host and exit — the smallest useful Navi
config, meant to drop straight into a CI pipeline after a deploy.

## Scenario

Your app is deployed at `https://shop.example.com`. After each release you want a
worker pool to hit the handful of pages that are expensive to render cold — the
home page, the catalogue, and a couple of top landing pages — so the first real
visitor gets a warm cache. Success is every URL returning its expected status;
the CI step should finish on its own once the queue drains.

## Configuration

```yaml
workers:
  quantity: 5

clients:
  default:
    base_url: https://shop.example.com

resources:
  pages:
    - url: /
      status: 200
    - url: /catalogue
      status: 200
    - url: /deals
      status: 200
    - url: /about
      status: 200
```

Run it:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi loads the config, sees no `web:` key, and runs headlessly. It enqueues one
job per entry under `resources.pages` — four jobs in total — and hands them to
the five workers, so all four run concurrently on the first tick.

Each job fetches its URL through `clients.default` (`https://shop.example.com` +
the path) and compares the response status to `status`. A job that gets `200`
succeeds. A job that gets anything else — say `/deals` returns `503` while a
cache node restarts — is re-queued after `workers.retry_cooldown` (2000 ms) and
retried up to `workers.max-retries` (3) times; still failing after that, it moves
to the dead queue.

When no jobs are left running or waiting for retry, the process exits. With no
`failure.threshold` set, the exit code is always `0` even if `/deals` ended up
dead — the run reports the failure in its output but never fails the build.

## Notes

- Add `failure.threshold` and worker tuning when you *do* want dead jobs to fail
  the pipeline — see [CI warm-up with a failure threshold](ci-failure-threshold.md).
- Full field reference for `clients`, `resources`, `url`, and `status`:
  [Prerequisites](../prerequisites.md). Headless vs. web UI mode:
  [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
