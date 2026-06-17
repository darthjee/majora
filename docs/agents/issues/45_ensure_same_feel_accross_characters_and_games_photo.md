# Ensure same feel across characters and games photo

## Context

On the characters and games index pages, each photo (`CardAvatar`/`CardPhoto`) sits directly inside the card, so the image's natural size determines the position of the elements below it. This makes the layout inconsistent whenever images have different dimensions.

## What needs to be done

- Frontend:
  - Wrap the photo rendered by `CardAvatar` and `CardPhoto` in a dedicated square container, independent of the image's own size.
  - The container should be a fixed square (width = height), with its width matching the parent card's width, and the image should fill it (e.g. via `object-fit: cover`) without affecting the layout of surrounding card elements.

## Acceptance criteria

- [ ] Photos on the characters index pages (PCs/NPCs) and the games index page are each wrapped in a square container matching the card width
- [ ] Image aspect ratio differences no longer shift the position of the card title/body below the photo
- [ ] Existing Jasmine specs for `CardAvatar` and `CardPhoto` are updated and pass
