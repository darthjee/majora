# Make the client-release job trusted-publishing ready

In `.circleci/config.yml`, job `client-release`:

- Add `environment: { NPM_PIN: 11.21.1, NPM_MIN: 11.5.1 }` and a step before the publish that
  prints `node --version` / `npm --version` and installs `npm@${NPM_PIN}` globally only when the
  image's npm is below `NPM_MIN` (same `sort -V` check as arcanum's `publish-cli` job). Use `sudo`
  only if the image requires it for global installs.
- Check the Node version of `darthjee/circleci_node:0.2.1`. If it is below 22.14.0, switch this job
  (only this one) to an image with Node ≥ 22.14 that still has `git` (the script uses
  `git fetch --tags` / `git show`), e.g. `cimg/node:22.14`.
- Do not add a `context:` to the job in the workflow (the trusted publisher identity would no
  longer match).
- Update the step name/comment if it mentions the token.

## Files to Change

- `.circleci/config.yml` — `client-release` job: npm pin step, env, image if needed.
