# Frontend Plan: Ensure same feel across characters and games photo

Main plan: [plan.md](plan.md)

## Tasks

1. Add a `.card-photo-square` rule to `frontend/assets/css/main.scss`: `width: 100%; aspect-ratio: 1 / 1; overflow: hidden;` and a nested `img { width: 100%; height: 100%; object-fit: cover; }`.
2. Update `CardAvatar.jsx` to wrap its `<img>` in a `<div className="card-photo-square">`.
3. Update `CardPhoto.jsx` to wrap its `<img>` in a `<div className="card-photo-square">`.
4. Remove the now-redundant `card-img-top img-fluid` sizing classes from the `<img>` elements if they conflict with `object-fit: cover` (keep `card-img-top` for Bootstrap card spacing if needed, drop `img-fluid`).
5. Update Jasmine specs `CardAvatarSpec.js` and `CardPhotoSpec.js` to assert the new wrapper element exists.

## Files

| File | Change |
|------|--------|
| `frontend/assets/css/main.scss` | Add `.card-photo-square` rule |
| `frontend/assets/js/components/elements/CardAvatar.jsx` | Wrap image in square container |
| `frontend/assets/js/components/elements/CardPhoto.jsx` | Wrap image in square container |
| `frontend/specs/assets/js/components/elements/CardAvatarSpec.js` | Update assertions |
| `frontend/specs/assets/js/components/elements/CardPhotoSpec.js` | Update assertions |
