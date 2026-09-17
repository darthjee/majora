# Writting: add missing space after # in 15 atx-style Markdown headings under docs/agents/specs/

## Context

Codacy's markdownlint scan (`MD018`, CodeStyle, Info severity) flags 15 headings across `docs/agents/specs/` for missing a space after the `#` in atx-style headings (e.g. `#Heading` instead of `# Heading`). Most Markdown renderers won't render these as headings at all, breaking the document's structure and table of contents.

## What needs to be done

Docs: add a space after the `#`(s) at each location below so the heading renders correctly:

- docs/agents/specs/loot-crawling/interactive-collection-enqueue.md:5, :16, :245, :312
- docs/agents/specs/loot-crawling/emission-endpoint.md:115, :116, :124
- docs/agents/specs/loot-crawling/source-to-collections.md:27
- docs/agents/product/entities/game-item.md:9
- docs/agents/specs/loot-crawling/collection-to-stl-models.md:12, :83, :153
- docs/agents/specs/loot-crawling/model-changes.md:32
- docs/agents/specs/crawler-test-harness.md:11, :143

## Acceptance criteria

- [ ] All 15 flagged headings have a space after the `#`
- [ ] The headings render correctly and appear in each document's outline
- [ ] Codacy's markdownlint `MD018` finding count drops to 0 for these files
