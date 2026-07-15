import React from 'react';
import Avatar from '../../../../common/Avatar.jsx';
import TextareaField from '../../../../common/TextareaField.jsx';
import SubmitButton from '../../../../common/SubmitButton.jsx';
import LoadMoreButton from '../../../../common/LoadMoreButton.jsx';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Rendering helper for the session messages section (list + post form).
 */
export default class SessionMessagesHelper {
  /**
   * Render the messages section.
   *
   * @param {{messages: Array, nextEntryId: (number|string|null), loadingMore: boolean,
   *   content: string, posting: boolean, fieldErrors: object}} state - Messages section state.
   * @param {{onLoadMore: Function, onContentChange: Function, onSubmit: Function}} handlers - Event handlers.
   * @returns {React.ReactElement} Rendered messages section.
   */
  static render(state, handlers) {
    return (
      <div className="row mt-4">
        <div className="col-md-8">
          <h2>{Translator.t('game_session_page.messages_title')}</h2>
          {state.messages.map((message) => SessionMessagesHelper.#renderMessage(message))}
          <LoadMoreButton
            visible={Boolean(state.nextEntryId)}
            loading={state.loadingMore}
            onClick={handlers.onLoadMore}
            label={Translator.t('game_session_page.messages_load_more')}
          />
        </div>
        <div className="col-md-4">
          <form onSubmit={handlers.onSubmit}>
            <TextareaField
              id="session-message-content"
              label={Translator.t('game_session_page.messages_content_label')}
              value={state.content}
              onChange={handlers.onContentChange}
              errors={state.fieldErrors.content ?? []}
            />
            <SubmitButton disabled={state.posting}>
              {Translator.t('game_session_page.messages_submit')}
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }

  static #renderMessage(message) {
    return (
      <div key={message.id} className="d-flex align-items-start mb-3">
        <Avatar url={message.user.avatar_url} alt={message.user.name} />
        <div className="ms-2">
          <strong>{message.user.name}</strong>
          <p className="text-pre-wrap mb-0">{message.content}</p>
        </div>
      </div>
    );
  }
}
