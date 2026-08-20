# Thread an optional photo className through CardPhoto/ActionsOverlay

`CardPhoto.jsx` gains an optional `className` prop, defaulting to today's
`'card-photo-square'`, so its wrapper div's class becomes overridable
without touching the shared default:

```jsx
export default function CardPhoto({ url, alt, className = 'card-photo-square' }) {
  return (
    <div className={className}>
      <img src={url || defaultGamePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
```

`ActionsOverlay` gains an optional `photoClassName` prop, forwarded to
`<Photo url={url} alt={alt} className={photoClassName} />`. The other
`PHOTO_COMPONENTS` entries (`CardTreasureImage`, `CardItemImage`, etc.)
only destructure `{ url, alt }` in their own signatures, so passing the
extra `className` prop to them is inert — no changes needed on their side.

`PhotoCardHelper.jsx`'s direct `<CardPhoto url={photo.path} alt={alt} />`
call (used for game/character/document photo galleries) must NOT be
touched — no `className` passed there, so it keeps defaulting to
`card-photo-square`, keeping photo galleries square and unaffected by this
issue.

## Files to Change

- `frontend/assets/js/components/common/cards/CardPhoto.jsx` — add the optional `className` prop with the `'card-photo-square'` default.
- `frontend/assets/js/components/common/misc/ActionsOverlay.jsx` — add the optional `photoClassName` prop and forward it to `<Photo>`.
