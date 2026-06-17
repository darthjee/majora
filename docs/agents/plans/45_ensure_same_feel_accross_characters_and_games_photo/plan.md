# Plan: Ensure same feel across characters and games photo

Issue: [45_ensure_same_feel_accross_characters_and_games_photo.md](../../issues/45_ensure_same_feel_accross_characters_and_games_photo.md)

## Branch

`issue-45`

## Overview

Wrap the images rendered by `CardAvatar` and `CardPhoto` in a fixed-size square container so that image aspect ratio no longer affects card layout. The container's width matches its parent card's width, and the image fills it via `object-fit: cover`.

## Agents involved

- [Frontend](frontend.md)
