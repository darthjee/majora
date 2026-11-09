# Create the Epic and sub-issues on GitHub

Create the Epic first, then each sub-issue in order, and link every sub-issue to the Epic with
GitHub's native sub-issue relationship (`gh api repos/<owner>/<repo>/issues/<epic>/sub_issues`
with the sub-issue's numeric id). Label the Epic `Epic`; label sub-issues `Created` so they go
through `/discuss-issue` before planning. Comment on #1705 and #1696 with the Epic's number.

Do not reuse #1705's own number range assumptions: record the real numbers returned by GitHub
and use them in step 03.

## Files to Change

- None in the repository (GitHub only).
