# Writting: wrap 3 bare URLs in README.md as Markdown links

## Context

Codacy's markdownlint scan (`MD034`, BestPractice, Info severity) flags 3 bare URLs in `README.md` (lines 90-92). Bare URLs render inconsistently across Markdown viewers and aren't as readable as a properly labeled link.

## What needs to be done

Docs: wrap each bare URL at README.md:90, :91, :92 in Markdown link syntax (`[label](url)` or `<url>` at minimum), using a descriptive label where one makes sense.

## Acceptance criteria

- [ ] The 3 flagged URLs in README.md are no longer bare
- [ ] Codacy's markdownlint `MD034` finding clears for this file
