# Plan: Refactor: finish splitting 5 React functions still over the 50-line complexity limit

Issue: [1412-refactor-finish-splitting-5-react-functions-still-over-the-50-line-complexity-limit.md](../../issues/1412-refactor-finish-splitting-5-react-functions-still-over-the-50-line-complexity-limit.md)

## Overview
Five React page/header components are still 1–4 lines over Codacy's Lizard `nloc-medium` limit (50 lines of code). Each one gets a small, behavior-neutral extraction (custom hook or static helper) so it drops to 50 lines or fewer. All work is inside `frontend/`.

See [frontend.md](frontend.md) for the full plan.
