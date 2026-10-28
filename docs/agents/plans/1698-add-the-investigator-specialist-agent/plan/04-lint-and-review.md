# Lint and review

Run the markdown lint through docker-compose (`yarn lint_md`, as the CI markdownlint job does)
and fix any findings. Check that every new link resolves, that the rules in the agent file and
the docs page agree, and that no example contains a real IP, user ID, session ID, token or
secret value.

## Files to Change

- Any file from steps 01–03 that the lint flags.
