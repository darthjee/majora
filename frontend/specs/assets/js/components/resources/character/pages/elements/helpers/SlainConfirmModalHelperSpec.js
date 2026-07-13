import SlainConfirmModalHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/SlainConfirmModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';

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

  return findElement(node.props?.children, matcher);
};

describe('SlainConfirmModalHelper', function() {
  const buildHandlers = () => ({
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the "Mark as Slain" title and body when currently alive', function() {
      const element = SlainConfirmModalHelper.render(true, false, false, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Mark as Slain');
      expect(JSON.stringify(element)).toContain('Are you sure you want to mark this character as slain?');
    });

    it('renders the "Revive Character" title and body when currently slain', function() {
      const element = SlainConfirmModalHelper.render(true, true, false, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Revive Character');
      expect(JSON.stringify(element)).toContain('Are you sure you want to revive this character?');
    });

    it('renders the public "Mark as Publicly Slain" title and body when currently public-alive', function() {
      const element = SlainConfirmModalHelper.render(true, false, true, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Mark as Publicly Slain');
      expect(JSON.stringify(element))
        .toContain('Are you sure you want to mark this character as publicly slain?');
    });

    it('renders the public "Publicly Revive Character" title and body when currently public-slain', function() {
      const element = SlainConfirmModalHelper.render(true, true, true, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Publicly Revive Character');
      expect(JSON.stringify(element))
        .toContain('Are you sure you want to publicly revive this character?');
    });

    it('uses the danger variant for the confirm button when currently alive', function() {
      const element = SlainConfirmModalHelper.render(true, false, false, buildHandlers());
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-danger')
      );

      expect(confirmButton).not.toBeNull();
    });

    it('uses the success variant for the confirm button when currently slain', function() {
      const element = SlainConfirmModalHelper.render(true, true, false, buildHandlers());
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-success')
      );

      expect(confirmButton).not.toBeNull();
    });

    it('wires the cancel and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = SlainConfirmModalHelper.render(true, false, false, handlers);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-danger')
      );

      cancelButton.props.onClick();
      confirmButton.props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
    });

    it('wires the modal onHide to the cancel handler', function() {
      const handlers = buildHandlers();
      const element = SlainConfirmModalHelper.render(true, false, false, handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onCancel).toHaveBeenCalled();
    });

    it('respects the show flag', function() {
      const element = SlainConfirmModalHelper.render(false, false, false, buildHandlers());
      const modal = findElement(element, (child) => child.type === Modal);

      expect(modal.props.show).toBe(false);
    });
  });
});
