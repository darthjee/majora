# Plan: Reduce `games/serializers/__init__.py` load

Issue: [1216-reduce-init-py-load.md](../../issues/1216-reduce-init-py-load.md)

## Overview

Convert `backend/games/serializers/__init__.py` from eager top-level imports to PEP 562
lazy loading, preserving every existing import path (~182 consumer files) while removing
the eager-loading cost. Single-owner plan — backend only.

See [backend.md](backend.md) for the full plan.
