# crawler Plan: Document how to run the Lootstudios crawler

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Write `crawler/RUNNING.md`

Create `crawler/RUNNING.md` with four sections, matching the issue's Expected
Behavior:

- **Prerequisites** — Node.js/Navi tooling needed locally, referencing
  `docs/agents/external/HOW_TO_USE_NAVI.md`'s Option B (`navi-hey` run from the
  command line, since this is a local/on-demand run, not CI); a valid Majora
  API token (`Authorization: Token <key>`), obtained via Django admin per
  `docs/guides/majora.md#authentication`.
- **Obtaining/refreshing the Lootstudios session** — how the maintainer gets
  the session credential the Navi config from #1263 expects, and what to do
  when it expires. If #1263 isn't merged yet when this step runs, pull the
  exact credential mechanism from #1263's resolved issue/plan rather than
  guessing; note explicitly in the doc if a detail is still provisional.
- **Running it** — the actual command to invoke the crawler, and where
  output/logs/errors surface. Same caveat: source this from #1263's actual
  implementation once available.
- **Verifying it worked** — what to check in Majora afterward (new/updated
  `StlModel`s under the "Lootstudios" `Source`, correct `lootstudio` link back
  to the source page per `docs/guides/majora/miniatures.md`), and how a re-run
  is distinguishable from an error (upsert behavior from #1262).

### Step 2 — Link it from `crawler/README.md`

Add a short "Running the crawler" section (or update the existing "Planned
shape"/"Explicitly out of scope" sections, which currently describe the
scaffold as not-yet-implemented) linking to `RUNNING.md`.

## Files to Change

- `crawler/RUNNING.md` — new permanent runbook (prerequisites, session
  credential, running, verifying).
- `crawler/README.md` — add a link to `RUNNING.md`; update stale
  "scaffold only" framing where it now conflicts with the new doc.

## Notes

- This plan documents #1262 (backend crawler-import endpoint) and #1263 (Navi
  crawler config), neither of which is implemented yet as of this writing
  (#1263 is still in `Writting` status). The doc's "Running it" and
  "Obtaining/refreshing the session" sections depend on those sub-issues'
  actual resolution — whoever implements this plan should re-check #1262/#1263
  first and write the doc to match what was actually built, not what was
  originally speculated in those issues.
- Do not guess or fabricate exact commands/flags/log locations if #1263 hasn't
  landed yet — mark them explicitly as TBD / "see #1263" rather than inventing
  plausible-sounding specifics.
