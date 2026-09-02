# CI warm-up with a failure threshold

Run a post-deploy warm-up that fails the pipeline when too large a share of jobs
end up dead, with the worker pool tuned for a CI runner.

## Scenario

A CI step warms `https://shop.example.com` after every deploy. A stray 404 or a
slow endpoint shouldn't fail the build, but if a large fraction of the warmed
URLs are broken you want the deploy flagged. You decide the build should fail
when more than 10% of jobs are dead, and you want ten workers with a short retry
cooldown so the step finishes quickly.

## Configuration

```yaml
workers:
  quantity: 10
  retry_cooldown: 2000
  max-retries: 3

failure:
  threshold: 10.0

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
    - url: /contact
      status: 200
```

Run it as the CI step's command:

```bash
npx navi-hey --config navi_config.yml
```

## What happens

Navi runs headlessly (no `web:` key) and enqueues one job per entry under
`resources.pages` — five jobs — across ten workers, so all five run on the first
tick.

Each job that returns a non-matching status is re-queued after
`workers.retry_cooldown` (2000 ms) and retried up to `workers.max-retries` (3)
times before moving to the dead queue.

When the queue drains, Navi computes `dead / total * 100`. With five jobs: if one
ends up dead that's `20.0`, which is greater than `failure.threshold` (`10.0`),
so the process exits non-zero and the CI step fails. If every job succeeds the
ratio is `0.0` and the process exits `0`.

Without `failure.threshold`, the exit code would always be `0` regardless of dead
jobs — see [Basic headless cache warm-up](basic-warmup.md).

## Notes

- `failure.threshold` is a percentage from 0 to 100. It is checked once, after
  the queue drains.
- Field reference for `workers.*` and the `failure.threshold` row:
  [Prerequisites](../prerequisites.md). Headless vs. web UI mode and CI guidance:
  [Reference](../reference.md).

---
[← Back to Samples](../samples.md)
