import React from 'react';
import CharacterPhoto from './CharacterPhoto.jsx';

/**
 * Gallery of additional character photos.
 * Renders nothing when the photos array is empty.
 *
 * @param {object} props - Component props.
 * @param {object[]} props.photos - Array of photo objects.
 * @param {number} props.photos[].id - Photo ID.
 * @param {string} props.photos[].url - Photo URL.
 * @param {string} props.alt - Alt text applied to each image.
 * @returns {React.ReactElement|null} Photos gallery or null.
 */
export default function CharacterPhotos({ photos, alt }) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="row mt-4">
      {photos.map((photo) => (
        <CharacterPhoto key={photo.id} url={photo.url} alt={alt} />
      ))}
    </div>
  );
}
