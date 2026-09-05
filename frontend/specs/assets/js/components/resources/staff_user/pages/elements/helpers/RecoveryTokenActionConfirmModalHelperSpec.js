import RecoveryTokenActionConfirmModalHelper
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/elements/helpers/RecoveryTokenActionConfirmModalHelper.jsx';
import Modal from 'react-bootstrap/cjs/Modal.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

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

describe('RecoveryTokenActionConfirmModalHelper', function() {
  const buildHandlers = () => ({
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the delete title/body/confirm-label for the delete action', function() {
      const element = RecoveryTokenActionConfirmModalHelper.render(true, 'delete', buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);
      const body = findElement(element, (child) => child.type === Modal.Body);
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-danger')
      );

      expect(title.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.delete_title'));
      expect(body.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.delete_body'));
      expect(confirmButton.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.delete_confirm'));
    });

    it('renders the force-expire title/body/confirm-label for the force-expire action', function() {
      const element = RecoveryTokenActionConfirmModalHelper.render(true, 'force-expire', buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);
      const body = findElement(element, (child) => child.type === Modal.Body);
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-danger')
      );

      expect(title.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.force_expire_title'));
      expect(body.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.force_expire_body'));
      expect(confirmButton.props.children)
        .toBe(Translator.t('recovery_token_action_confirm_modal.force_expire_confirm'));
    });

    it('always uses the shared cancel label regardless of action', function() {
      const element = RecoveryTokenActionConfirmModalHelper.render(true, 'delete', buildHandlers());
      const cancelButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className === 'btn btn-secondary'
      );

      expect(cancelButton.props.children).toBe(Translator.t('recovery_token_action_confirm_modal.cancel'));
    });

    it('wires the cancel and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = RecoveryTokenActionConfirmModalHelper.render(true, 'delete', handlers);
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
      const element = RecoveryTokenActionConfirmModalHelper.render(true, 'delete', handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onCancel).toHaveBeenCalled();
    });

    it('respects the show flag', function() {
      const element = RecoveryTokenActionConfirmModalHelper.render(false, 'delete', buildHandlers());
      const modal = findElement(element, (child) => child.type === Modal);

      expect(modal.props.show).toBe(false);
    });
  });
});
