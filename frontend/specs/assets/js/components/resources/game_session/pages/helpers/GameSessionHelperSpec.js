import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionHelper.jsx';
import Noop from '../../../../../../../../assets/js/utils/Noop.js';

// Function components (e.g. PageActions, EditButton) are rendered by calling
// them with their props so the search can traverse into their output.
const isFunctionComponent = (type) => typeof type === 'function' && !type.prototype?.isReactComponent;

const childrenOf = (node) => {
  if (isFunctionComponent(node.type)) {
    return node.type(node.props);
  }

  return node.props?.children;
};

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(childrenOf(node), matcher);
};

describe('GameSessionHelper', function() {
  const session = {
    id: 7, title: 'Session 1', date: '2024-01-01', game_slug: 'demo',
  };
  const messagesState = {
    messages: [], nextEntryId: null, loadingMore: false, content: '', posting: false, fieldErrors: {},
  };
  const messagesHandlers = { onLoadMore: Noop.noop, onContentChange: Noop.noop, onSubmit: Noop.noop };

  describe('.render', function() {
    it('renders the session title', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers)))
        .toContain('Session 1');
    });

    it('renders the session date', function() {
      expect(renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers)))
        .toContain('2024-01-01');
    });

    it('renders a no-date placeholder when date is absent', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, date: null }, messagesState, messagesHandlers),
      );
      expect(html).toContain('No date');
    });

    it('renders a back button to the sessions index', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).toContain('href="#/games/demo/sessions"');
    });

    it('renders an edit link when can_edit is true', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: true }, messagesState, messagesHandlers),
      );
      expect(html).toContain('href="#/games/demo/sessions/7/edit"');
    });

    it('does not render an edit link when can_edit is false', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: false }, messagesState, messagesHandlers),
      );
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).not.toContain('/edit');
    });

    it('renders the description when present', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, description: 'A thrilling encounter.' }, messagesState, messagesHandlers),
      );
      expect(html).toContain('A thrilling encounter.');
      expect(html).toContain('text-pre-wrap');
    });

    it('does not render a description paragraph when description is absent', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).not.toContain('mt-3 text-pre-wrap');
    });

    it('renders the messages section', function() {
      const html = renderToStaticMarkup(GameSessionHelper.render(session, messagesState, messagesHandlers));
      expect(html).toContain('Messages');
    });

    it('renders a Create Pool button when can_edit is true and there is no date', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: true, date: null }, messagesState, messagesHandlers),
      );
      expect(html).toContain('Create Pool');
      expect(html).toContain('data-testid="create-poll-button"');
    });

    it('does not render a Create Pool button when can_edit is true but a date is set', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: true, date: '2024-01-01' }, messagesState, messagesHandlers),
      );
      expect(html).not.toContain('data-testid="create-poll-button"');
    });

    it('does not render a Create Pool button when can_edit is false, even without a date', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, can_edit: false, date: null }, messagesState, messagesHandlers),
      );
      expect(html).not.toContain('data-testid="create-poll-button"');
    });

    it('does not render a Create Pool button when can_edit is absent', function() {
      const html = renderToStaticMarkup(
        GameSessionHelper.render({ ...session, date: null }, messagesState, messagesHandlers),
      );
      expect(html).not.toContain('data-testid="create-poll-button"');
    });

    it('wires the Create Pool button click to the onOpenPollModal handler', function() {
      const onOpenPollModal = jasmine.createSpy('onOpenPollModal');
      const element = GameSessionHelper.render(
        { ...session, can_edit: true, date: null }, messagesState, messagesHandlers, onOpenPollModal,
      );
      const button = findElement(element, (child) => child.props?.['data-testid'] === 'create-poll-button');

      button.props.onClick();

      expect(onOpenPollModal).toHaveBeenCalled();
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameSessionHelper.renderLoading())).toContain('Loading session');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GameSessionHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
