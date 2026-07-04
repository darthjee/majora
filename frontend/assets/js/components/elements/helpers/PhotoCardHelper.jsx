import React from 'react';
import CardPhoto from '../CardPhoto.jsx';

/**
 * Rendering helper for the PhotoCard element.
 */
export default class PhotoCardHelper {
  /**
   * Render a Bootstrap card for a photo that opens a lightbox on click
   * instead of navigating to another page.
   *
   * @param {object} photo - Photo data object.
   * @param {number} photo.id - Photo ID.
   * @param {string} photo.path - Photo storage path, used as the image src.
   * @param {string} alt - Alt text applied to the photo image.
   * @param {Function} onClick - Handler invoked with the photo when the card is clicked.
   * @returns {React.ReactElement} Photo card element.
   */
  static render(photo, alt, onClick) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
        <button
          type="button"
          className="btn p-0 border-0 bg-transparent text-decoration-none text-dark w-100"
          onClick={() => onClick(photo)}
        >
          <div className="card h-100">
            <CardPhoto url={photo.path} alt={alt} />
          </div>
        </button>
      </div>
    );
  }
}
