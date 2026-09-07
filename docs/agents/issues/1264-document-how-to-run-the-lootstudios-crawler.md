# Issue: Document how to run the Lootstudios crawler

## Description

Last sub-issue in the Lootstudios STL Crawler chain (parent #1260), following
the exploration/spec work (#1265, #1266) and depending on the still-unwritten
Navi crawler configuration sub-issue (#1263) and backend crawler-import
endpoint (#1262) actually working end-to-end. This issue is documentation
only — it does not touch the crawler config or backend endpoint themselves,
only describes how to run what the prior sub-issues build.

The crawler is a maintainer-run tool by design: Lootstudios' catalog endpoint
(`GetMyLootsCache`, see #1265/#1266) is gated behind the requesting user's own
logged-in session, tied to whichever account owns the purchased library — not
a service credential — so this isn't something CI runs, it's something the
maintainer runs locally on demand.

## Problem

Once the Navi config and backend endpoint exist, there is no single place
telling a maintainer how to actually run the crawler: what tooling to install,
how to get/refresh the Lootstudios session credential the Navi config
expects, the exact invocation, and how to confirm it worked. Without this,
each run would require re-deriving the process from the config/endpoint code
directly, and the maintainer-run (not CI-run) nature of this tool means that
knowledge has nowhere else to live.

## Expected Behavior

A run-plan doc exists covering:

- **Prerequisites**: Node.js/Navi tooling needed locally (per
  `docs/agents/external/HOW_TO_USE_NAVI.md`'s Option B — installing/running
  `navi-hey` from the command line, since this is a local, on-demand run, not
  a CI step), and a valid Majora API token (`Authorization: Token <key>`,
  obtained via Django admin per `docs/guides/majora.md#authentication`).
- **Obtaining/refreshing the Lootstudios session**: how the maintainer gets
  the credential the Navi config (#1263) expects, and what to do when it
  expires.
- **Running it**: the actual command, and where output/logs/errors surface.
- **Verifying it worked**: what to check in Majora afterward (new/updated
  `StlModel`s under the "Lootstudios" `Source`, correct `lootstudio` link back
  to the source page) — and how to tell a re-run updated existing items
  rather than erroring.

A maintainer unfamiliar with the specific implementation details should be
able to follow the doc and run the crawler end-to-end unassisted.

## Solution

Add a new `crawler/RUNNING.md`, linked from `crawler/README.md`, structured
around the four points in Expected Behavior above (Prerequisites, Session
credential, Running it, Verifying it worked).

A separate file rather than growing `README.md` in place, because:

- `README.md` today describes the scaffold's *planned shape* (a project-level
  overview) — once #1262/#1263 land, that content shifts to describing what
  actually exists, and a runbook is a different kind of document (operational
  steps, not architecture) that reads better on its own page.
- This mirrors the hub-plus-page pattern already used for
  `docs/agents/specs.md` → `docs/agents/specs/loot-crawling.md` — except this
  page is **not** a spec: it is a permanent operational runbook, not removed
  once the feature is "done," since the crawler keeps being run manually
  going forward.

`README.md` gets a short "Running the crawler" section (or an update to its
existing "Planned shape"/"out of scope" sections once they're no longer
accurate) linking to `RUNNING.md`.

This issue only writes the doc — it does not implement #1262/#1263. Where
implementation details aren't final yet (e.g. exact CLI invocation, exact
log/output location), the doc should describe them at the level of precision
#1263's own eventual output actually provides; if #1263 isn't done by the
time this issue is worked, its still-open details should be filled in
directly from #1263's resolution rather than guessed here.

## Benefits

- Closes out the Lootstudios crawler chain (#1260) with a doc anyone (not
  just whoever implemented #1262/#1263) can follow to actually operate it.
- Keeps the maintainer-run nature of the tool explicit and documented, rather
  than assumed tribal knowledge.
- Separates "how it's designed" (specs, removed once implemented) from "how
  to run it" (a permanent runbook), consistent with the project's docs
  conventions.
