import { renderToStaticMarkup } from 'react-dom/server';
import SessionMessagesHelper
  from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/SessionMessagesHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

describe('SessionMessagesHelper', function() {
  const baseState = {
    messages: [],
    nextEntryId: null,
    loadingMore: false,
    content: '',
    posting: false,
    fieldErrors: {},
  };
  const handlers = { onLoadMore: Noop.noop, onContentChange: Noop.noop, onSubmit: Noop.noop };

  describe('.render', function() {
    it('renders the messages title', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render(baseState, handlers));
      expect(html).toContain('Messages');
    });

    it('renders each message with the author name and content', function() {
      const state = {
        ...baseState,
        messages: [
          { id: 1, content: 'Hello there', user: { name: 'Alice', avatar_url: 'http://example.com/a.png' } },
        ],
      };
      const html = renderToStaticMarkup(SessionMessagesHelper.render(state, handlers));
      expect(html).toContain('Alice');
      expect(html).toContain('Hello there');
      expect(html).toContain('http://example.com/a.png');
    });

    it('falls back to the default avatar when the message author has none', function() {
      const state = {
        ...baseState,
        messages: [{ id: 1, content: 'Hi', user: { name: 'Bob', avatar_url: null } }],
      };
      const html = renderToStaticMarkup(SessionMessagesHelper.render(state, handlers));
      expect(html).toContain('default_avatar');
    });

    it('does not render the load more button when there is no cursor', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render(baseState, handlers));
      expect(html).not.toContain('Load more messages');
    });

    it('renders the load more button when a cursor is present', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render({ ...baseState, nextEntryId: 5 }, handlers));
      expect(html).toContain('Load more messages');
    });

    it('disables the load more button while loading', function() {
      const state = { ...baseState, nextEntryId: 5, loadingMore: true };
      const html = renderToStaticMarkup(SessionMessagesHelper.render(state, handlers));
      expect(html).toContain('disabled=""');
    });

    it('renders the message content form field', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render({ ...baseState, content: 'Draft' }, handlers));
      expect(html).toContain('Draft');
      expect(html).toContain('Message');
    });

    it('renders field errors on the content field', function() {
      const state = { ...baseState, fieldErrors: { content: ['is required'] } };
      const html = renderToStaticMarkup(SessionMessagesHelper.render(state, handlers));
      expect(html).toContain('is required');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render(baseState, handlers));
      expect(html).toContain('Send');
    });

    it('disables the submit button while posting', function() {
      const html = renderToStaticMarkup(SessionMessagesHelper.render({ ...baseState, posting: true }, handlers));
      expect(html).toContain('disabled=""');
    });
  });
});
