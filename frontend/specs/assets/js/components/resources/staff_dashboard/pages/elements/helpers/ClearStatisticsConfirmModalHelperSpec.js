import Modal from 'react-bootstrap/cjs/Modal.js';
import { renderToStaticMarkup } from 'react-dom/server';
import ClearStatisticsConfirmModalHelper from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearStatisticsConfirmModalHelper.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

const findElement = (node, matcher) => {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (Array.isArray(node)) {
    return node.reduce((found, child) => found ?? findElement(child, matcher), null);
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

const isButton = (className) => (node) => node.type === 'button' && node.props.className.includes(className);

describe('ClearStatisticsConfirmModalHelper', function() {
  const buildHandlers = () => ({
    onChange: jasmine.createSpy('onChange'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
  });

  const render = (state, handlers = buildHandlers()) => ClearStatisticsConfirmModalHelper.render(true, state, handlers);

  describe('.render', function() {
    it('renders the title, body and instruction from the i18n namespace', function() {
      const element = render({ value: '', canConfirm: false });
      const title = findElement(element, (node) => node.type === Modal.Title);
      const json = JSON.stringify(element);

      expect(title.props.children).toBe(Translator.t('clear_statistics_confirm_modal.title'));
      expect(json).toContain(Translator.t('clear_statistics_confirm_modal.body'));
      expect(json).toContain(Translator.t('clear_statistics_confirm_modal.instruction'));
    });

    it('renders a labelled text input without autocomplete', function() {
      const element = render({ value: 'CL', canConfirm: false });
      const input = findElement(element, (node) => node.type === 'input');
      const label = findElement(element, (node) => node.type === 'label');

      expect(input.props.type).toBe('text');
      expect(input.props.className).toBe('form-control');
      expect(input.props.autoComplete).toBe('off');
      expect(input.props.value).toBe('CL');
      expect(label.props.htmlFor).toBe(input.props.id);
      expect(label.props.children).toBe(Translator.t('clear_statistics_confirm_modal.input_label'));
    });

    it('disables confirm when the value does not confirm', function() {
      const confirm = findElement(render({ value: 'clear', canConfirm: false }), isButton('btn-danger'));

      expect(confirm.props.disabled).toBeTrue();
    });

    it('enables confirm when the value confirms', function() {
      const confirm = findElement(render({ value: 'CLEAR', canConfirm: true }), isButton('btn-danger'));

      expect(confirm.props.disabled).toBeFalse();
      expect(confirm.props.children).toBe(Translator.t('clear_statistics_confirm_modal.confirm'));
    });

    it('wires the change, cancel, close and confirm handlers', function() {
      const handlers = buildHandlers();
      const element = render({ value: 'CLEAR', canConfirm: true }, handlers);

      findElement(element, (node) => node.type === 'input').props.onChange();
      findElement(element, isButton('btn-secondary')).props.onClick();
      findElement(element, isButton('btn-danger')).props.onClick();

      expect(handlers.onChange).toHaveBeenCalled();
      expect(handlers.onCancel).toHaveBeenCalled();
      expect(handlers.onConfirm).toHaveBeenCalled();
      expect(element.props.onHide).toBe(handlers.onCancel);
    });

    it('renders without errors as static markup', function() {
      expect(() => renderToStaticMarkup(render({ value: '', canConfirm: false }))).not.toThrow();
    });
  });
});
