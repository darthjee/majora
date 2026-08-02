# Product Definitions

This document is the authoritative reference for product-level concepts in Majora.
Specialist agents and the architect consult it when reasoning about domain rules,
ownership, and feature design. When product concepts are refined or new entities are
introduced, update this document in the same PR.

---

## Core Entities

The Core Entities section has been split into individual files under:

- docs/agents/product/entities/

See that directory for per-entity definitions (game, player, conversation, user, character,
gamemaster, treasure, game-item, game-document, poll) and ownership/permissions details.

Of particular note, [ownership-and-roles.md](product/entities/ownership-and-roles.md) defines the
character ownership chain (`character.player.user`), the GameMaster/DM and Staff roles, and the
full character-editing rule set (superuser/owner/DM plus the narrower NPC/PC player and
photo-upload/money leniencies). Read it in full when implementing or reviewing any character edit,
photo-upload, or money-edit permission.

---

