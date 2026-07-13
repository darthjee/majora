import LinksEditModalHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import { buildLink } from '../../../../../../../../support/factories.js';

// Function components (e.g. FormField) are rendered by calling them with
// their props so the search can traverse into their output; class/exotic
// components (Modal, Modal.Header, ...) are left as-is.
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

const findAllElements = (node, matcher, found = []) => {
  if (!node) {
    return found;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => findAllElements(child, matcher, found));

    return found;
  }

  if (typeof node !== 'object') {
    return found;
  }

  if (matcher(node)) {
    found.push(node);
  }

  findAllElements(childrenOf(node), matcher, found);

  return found;
};

describe('LinksEditModalHelper', function() {
  const buildHandlers = () => ({
    onClose: jasmine.createSpy('onClose'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onAddLink: jasmine.createSpy('onAddLink'),
    onToggleDelete: jasmine.createSpy('onToggleDelete'),
    onTextChange: jasmine.createSpy('onTextChange'),
    onUrlChange: jasmine.createSpy('onUrlChange'),
    onLinkTypeChange: jasmine.createSpy('onLinkTypeChange'),
  });

  const buildState = (overrides = {}) => ({
    links: [buildLink({ id: 1, text: 'Wiki', url: 'https://example.com/wiki', link_type: '' })],
    canConfirm: true,
    ...overrides,
  });

  describe('.render', function() {
    it('renders a Modal with the given show flag', function() {
      const element = LinksEditModalHelper.render(true, buildState(), buildHandlers());

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBe(true);
    });

    it('wires onHide to the onClose handler', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('renders a text input seeded with the link text', function() {
      const element = LinksEditModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'links-edit-text-0');

      expect(input.props.value).toBe('Wiki');
    });

    it('wires the text input change to onTextChange with the entry index', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'links-edit-text-0');

      input.props.onChange({ target: { value: 'New text' } });

      expect(handlers.onTextChange).toHaveBeenCalledWith(0, 'New text');
    });

    it('renders a url input seeded with the link url', function() {
      const element = LinksEditModalHelper.render(true, buildState(), buildHandlers());
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'links-edit-url-0');

      expect(input.props.value).toBe('https://example.com/wiki');
    });

    it('wires the url input change to onUrlChange with the entry index', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);
      const input = findElement(element, (child) => child.type === 'input' && child.props.id === 'links-edit-url-0');

      input.props.onChange({ target: { value: 'https://example.com/new' } });

      expect(handlers.onUrlChange).toHaveBeenCalledWith(0, 'https://example.com/new');
    });

    it('renders a link_type select with a blank "none" option and the lootstudio option', function() {
      const element = LinksEditModalHelper.render(true, buildState(), buildHandlers());
      const select = findElement(element, (child) => child.type === 'select');
      const options = findAllElements(select, (child) => child.type === 'option');

      expect(options.map((option) => option.props.value)).toEqual(['', 'lootstudio']);
    });

    it('wires the link_type select change to onLinkTypeChange with the entry index', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);
      const select = findElement(element, (child) => child.type === 'select');

      select.props.onChange({ target: { value: 'lootstudio' } });

      expect(handlers.onLinkTypeChange).toHaveBeenCalledWith(0, 'lootstudio');
    });

    it('wires the trash button to onToggleDelete with the entry index for an active link', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);
      const trashButton = findElement(
        element,
        (child) => child.type === 'button' && findElement(
          child.props.children,
          (icon) => icon.type === 'i' && icon.props.className?.includes('bi-trash-fill')
        )
      );

      trashButton.props.onClick();

      expect(handlers.onToggleDelete).toHaveBeenCalledWith(0);
    });

    it('collapses a deleted link to text-only with a restore button', function() {
      const handlers = buildHandlers();
      const state = buildState({
        links: [buildLink({
          id: 1, text: 'Wiki', url: 'https://example.com/wiki', delete: true,
        })],
      });
      const element = LinksEditModalHelper.render(true, state, handlers);
      const input = findElement(element, (child) => child.type === 'input');
      const restoreButton = findElement(
        element,
        (child) => child.type === 'button' && findElement(
          child.props.children,
          (icon) => icon.type === 'i' && icon.props.className?.includes('bi-plus-circle-fill')
        )
      );

      expect(input).toBeNull();

      restoreButton.props.onClick();

      expect(handlers.onToggleDelete).toHaveBeenCalledWith(0);
    });

    it('renders the Add Link button wired to onAddLink', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState({ links: [] }), handlers);
      const button = findElement(element, (child) => child.type === 'button' && child.props.onClick === handlers.onAddLink);

      expect(button).not.toBeNull();

      button.props.onClick();

      expect(handlers.onAddLink).toHaveBeenCalled();
    });

    it('renders Cancel/Confirm buttons in the footer, wired to onClose/onConfirm', function() {
      const handlers = buildHandlers();
      const element = LinksEditModalHelper.render(true, buildState(), handlers);
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const buttons = findAllElements(footer, (child) => child.type === 'button');

      const cancelButton = buttons.find((button) => button.props.onClick === handlers.onClose);
      const confirmButton = buttons.find((button) => button.props.onClick === handlers.onConfirm);

      cancelButton.props.onClick();
      confirmButton.props.onClick();

      expect(handlers.onClose).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
    });

    it('disables the Confirm button when canConfirm is false', function() {
      const element = LinksEditModalHelper.render(true, buildState({ canConfirm: false }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(true);
    });

    it('enables the Confirm button when canConfirm is true', function() {
      const element = LinksEditModalHelper.render(true, buildState({ canConfirm: true }), buildHandlers());
      const footer = findElement(element, (child) => child.type === Modal.Footer);
      const confirmButton = findAllElements(footer, (child) => child.type === 'button')
        .find((button) => button.props.className.includes('btn-primary'));

      expect(confirmButton.props.disabled).toBe(false);
    });

    it('renders a block per link entry', function() {
      const state = buildState({
        links: [
          buildLink({ id: 1 }),
          buildLink({ id: 2 }),
        ],
      });
      const element = LinksEditModalHelper.render(true, state, buildHandlers());
      const inputs = findAllElements(element, (child) => child.type === 'input' && child.props.id?.startsWith('links-edit-text-'));

      expect(inputs.length).toBe(2);
    });
  });
});
