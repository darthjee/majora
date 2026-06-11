import React from 'react';

/**
 * Bootstrap card representing a single game.
 *
 * @param {object} props - Component props.
 * @param {object} props.game - Game data object.
 * @param {string} props.game.name - Game name.
 * @param {string} props.game.game_slug - Game slug used for the detail link.
 * @param {string|null} [props.game.photo] - Optional cover image URL.
 * @returns {React.ReactElement} Game card element.
 */
export default function GameCard({ game }) {
  return (
    <div className="col-sm-6 col-md-4 col-lg-3 mb-4">
      <a href={`#/games/${game.game_slug}`} className="text-decoration-none text-dark">
        <div className="card h-100">
          {game.photo
            ? (
              <img
                src={game.photo}
                className="card-img-top img-fluid"
                alt={game.name}
              />
            )
            : (
              <div
                className="card-img-top bg-light d-flex align-items-center justify-content-center"
                style={{ height: '160px' }}
              >
                <span className="text-muted">No image</span>
              </div>
            )}
          <div className="card-body">
            <h5 className="card-title">{game.name}</h5>
          </div>
        </div>
      </a>
    </div>
  );
}
