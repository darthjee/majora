import React from 'react';

/**
 * Bootstrap card image that falls back to a placeholder when no URL is provided.
 *
 * @param {object} props - Component props.
 * @param {string|null} [props.url] - Image URL, or null/undefined for the placeholder.
 * @param {string} props.alt - Alt text used when the image is rendered.
 * @returns {React.ReactElement} Image element or placeholder div.
 */
export default function CardPhoto({ url, alt }) {
  if (url) {
    return <img src={url} className="card-img-top img-fluid" alt={alt} />;
  }

  return (
    <div
      className="card-img-top bg-light d-flex align-items-center justify-content-center"
      style={{ height: '160px' }}
    >
      <span className="text-muted">No image</span>
    </div>
  );
}
