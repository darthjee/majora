# Plan: Crawler: scaffold the Navi extension project in crawler/navi-extension/

Issue: [1293-crawler-scaffold-the-navi-extension-project-in-crawler-navi-extension.md](../issues/1293-crawler-scaffold-the-navi-extension-project-in-crawler-navi-extension.md)

## Overview

Stand up a standalone Navi extension project at `crawler/navi-extension/` (its
own `package.json`), per `docs/agents/external/navi/extending-navi.md`: a
trivial "hello" backend route + frontend page + menu entry, proving the whole
build/mount/test wiring end to end with no crawler/enqueue logic yet.

See [crawler.md](crawler.md) for the full plan.
