# Plan: Codacy isn't honoring the existing nosemgrep suppression in game_poll_votes.py

Issue: [1195-codacy-isn-t-honoring-the-existing-nosemgrep-suppression-in-game-poll-votes-py.md](../issues/1195-codacy-isn-t-honoring-the-existing-nosemgrep-suppression-in-game-poll-votes-py.md)

## Overview

Codacy's Opengrep integration keeps `backend/games/views/polls/game_poll_votes.py:70`'s `request-data-write` finding open despite an existing `# nosemgrep: ...` suppression. This is a single-agent backend task.

See [backend.md](backend.md) for the full plan.
