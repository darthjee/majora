import Modal from 'react-bootstrap/cjs/Modal.js';
import ApiTokenRevokeConfirmModalHelper
  from '../../../../../../../assets/js/components/common/api_tokens/helpers/ApiTokenRevokeConfirmModalHelper.jsx';

const findAll = (node, matcher, found = []) => {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, found));
  } else if (node && typeof node === 'object') {
    if (matcher(node)) found.push(node);
    findAll(node.props?.children, matcher, found);
  }
  return found;
};

describe('ApiTokenRevokeConfirmModalHelper', function() {
  const buildHandlers = () => ({
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.body', function() {
    it('names the token in the owner variant', function() {
      const body = ApiTokenRevokeConfirmModalHelper.body({ tokenName: 'CI bot' });

      expect(body).toContain('"CI bot"');
      expect(body).not.toContain('owned by');
    });

    it('names the token and its owner in the staff variant', function() {
      const body = ApiTokenRevokeConfirmModalHelper.body({ tokenName: 'CI bot', ownerName: 'Ann' });

      expect(body).toContain('"CI bot"');
      expect(body).toContain('owned by Ann');
    });
  });

  describe('.render', function() {
    it('renders a modal bound to show and onCancel', function() {
      const handlers = buildHandlers();
      const element = ApiTokenRevokeConfirmModalHelper.render(
        { show: true, tokenName: 'CI', submitting: false }, handlers,
      );

      expect(element.type).toBe(Modal);
      expect(element.props.show).toBeTrue();
      expect(element.props.onHide).toBe(handlers.onCancel);
    });

    it('wires the confirm and cancel buttons', function() {
      const handlers = buildHandlers();
      const element = ApiTokenRevokeConfirmModalHelper.render(
        { show: true, tokenName: 'CI', submitting: false }, handlers,
      );
      const buttons = findAll(element, (node) => node.type === 'button');

      buttons[0].props.onClick();
      buttons[1].props.onClick();

      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
      expect(buttons[1].props.children).toBe('Revoke token');
    });

    it('disables the buttons while submitting', function() {
      const element = ApiTokenRevokeConfirmModalHelper.render(
        { show: true, tokenName: 'CI', submitting: true }, buildHandlers(),
      );
      const buttons = findAll(element, (node) => node.type === 'button');

      expect(buttons.every((button) => button.props.disabled)).toBeTrue();
    });
  });
});
