# Add the rectangular card photo SCSS class

Add a new `.card-photo-rect` class alongside the existing
`.card-photo-square` (same file, same structure — only the sizing rule
differs: a fixed `height` instead of `aspect-ratio`, so the box stays a
constant height across every column width while width always fills 100%
of the column):

```scss
.card-photo-rect {
  width: 100%;
  height: 220px; // starting value — confirm visually before finalizing
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

## Files to Change

- `frontend/assets/css/main.scss` — add `.card-photo-rect` next to the existing `.card-photo-square` rule (around line 22-32).
