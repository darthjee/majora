import React from 'react';
import ErrorAlert from '../../../../common/ErrorAlert.jsx';
import LoadingMessage from '../../../../common/LoadingMessage.jsx';
import NewButton from '../../../../common/NewButton.jsx';
import PageActions from '../../../../common/PageActions.jsx';
import Pagination from '../../../../common/Pagination.jsx';
import TreasureCard from '../../../../common/TreasureCard.jsx';
import Translator from '../../../../../i18n/Translator.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Rendering helper for the Game Treasures listing page.
 */
export default class GameTreasuresHelper {
  /**
   * Render the treasures list with pagination and a back button.
   *
   * @param {object[]} treasures - List of treasure objects.
   * @param {object} pagination - Pagination metadata.
   * @param {number} pagination.page - Current page.
   * @param {number} pagination.pages - Total pages.
   * @param {number} pagination.perPage - Items per page.
   * @param {string} basePath - Base hash path used for pagination links.
   * @param {string} gameSlug - Current game slug, used to build each card's edit link and to
   *   determine per-treasure manage permission via an exact `game_slug` match.
   * @param {string} backHref - Hash path to the parent game page.
   * @param {boolean} [canEdit] - Whether the current user may create new treasures and manage
   *   this game's exclusive treasures (upload photos, edit).
   * @param {string} [newHref] - Hash path to the new treasure form.
   * @param {Function} [onUploadClick] - Handler invoked with a treasure when its upload button is clicked.
   * @returns {React.ReactElement} Treasures list with pagination.
   */
  static render(
    treasures, pagination, basePath, gameSlug, backHref,
    canEdit = false, newHref = '', onUploadClick = Noop.noop,
  ) {
    return (
      <div className="container mt-4">
        <PageActions backHref={backHref}>
          {canEdit && (
            <NewButton href={newHref}>
              {Translator.t('game_treasures_page.new_treasure')}
            </NewButton>
          )}
        </PageActions>
        <h1 className="mb-4">{Translator.t('game_treasures_page.treasures')}</h1>
        <div className="row">
          {treasures.map((treasure) => (
            <TreasureCard
              key={treasure.id}
              treasure={treasure}
              canManage={canEdit && treasure.game_slug === gameSlug}
              onUploadClick={onUploadClick}
              editHref={`#/games/${gameSlug}/treasures/${treasure.id}/edit`}
            />
          ))}
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          perPage={pagination.perPage}
          basePath={basePath}
        />
      </div>
    );
  }

  /**
   * Render the loading state.
   *
   * @returns {React.ReactElement} Loading message.
   */
  static renderLoading() {
    return <LoadingMessage message={Translator.t('game_treasures_page.loading')} />;
  }

  /**
   * Render the error state.
   *
   * @param {string} error - Error message.
   * @returns {React.ReactElement} Error alert.
   */
  static renderError(error) {
    return <ErrorAlert error={error} />;
  }
}
