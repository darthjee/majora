import DenyAuthorizationRequestModalHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/DenyAuthorizationRequestModalHelper.jsx';
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

describe('DenyAuthorizationRequestModalHelper', function() {
  const buildHandlers = () => ({
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the dismiss title and body', function() {
      const element = DenyAuthorizationRequestModalHelper.render(true, null, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe('Deny authorization request');
      expect(JSON.stringify(element)).toContain('Are you sure you want to deny this authorization request?');
    });

    it('renders the ip/browser info when a request is given', function() {
      const request = { ip: '203.0.113.5', browser: 'Firefox' };
      const element = DenyAuthorizationRequestModalHelper.render(true, request, buildHandlers());

      expect(JSON.stringify(element)).toContain('203.0.113.5');
      expect(JSON.stringify(element)).toContain('Firefox');
    });

    it('wires the cancel and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = DenyAuthorizationRequestModalHelper.render(true, null, handlers);
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Cancel'
      );
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.children === 'Confirm'
      );

      cancelButton.props.onClick();
      confirmButton.props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
    });

    it('wires the modal onHide to the cancel handler', function() {
      const handlers = buildHandlers();
      const element = DenyAuthorizationRequestModalHelper.render(true, null, handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onCancel).toHaveBeenCalled();
    });

    it('respects the show flag', function() {
      const element = DenyAuthorizationRequestModalHelper.render(false, null, buildHandlers());
      const modal = findElement(element, (child) => child.type === Modal);

      expect(modal.props.show).toBe(false);
    });
  });
});
