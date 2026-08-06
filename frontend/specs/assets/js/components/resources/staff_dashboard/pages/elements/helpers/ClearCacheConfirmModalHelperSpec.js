import ClearCacheConfirmModalHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCacheConfirmModalHelper.jsx';
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

describe('ClearCacheConfirmModalHelper', function() {
  const buildHandlers = () => ({
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  describe('.render', function() {
    it('renders the title and body from the clear_cache_confirm_modal i18n namespace', function() {
      const element = ClearCacheConfirmModalHelper.render(true, buildHandlers());
      const title = findElement(element, (child) => child.type === Modal.Title);

      expect(title.props.children).toBe(Translator.t('clear_cache_confirm_modal.title'));
      expect(JSON.stringify(element)).toContain(Translator.t('clear_cache_confirm_modal.body'));
    });

    it('uses the danger variant for the confirm button', function() {
      const element = ClearCacheConfirmModalHelper.render(true, buildHandlers());
      const confirmButton = findElement(
        element,
        (child) => child.type === 'button' && child.props.className.includes('btn-danger')
      );

      expect(confirmButton).not.toBeNull();
      expect(confirmButton.props.children).toBe(Translator.t('clear_cache_confirm_modal.confirm'));
    });

    it('wires the cancel and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = ClearCacheConfirmModalHelper.render(true, handlers);
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
      const element = ClearCacheConfirmModalHelper.render(true, handlers);
      const modal = findElement(element, (child) => child.type === Modal);

      modal.props.onHide();

      expect(handlers.onCancel).toHaveBeenCalled();
    });

    it('respects the show flag', function() {
      const element = ClearCacheConfirmModalHelper.render(false, buildHandlers());
      const modal = findElement(element, (child) => child.type === Modal);

      expect(modal.props.show).toBe(false);
    });
  });
});
