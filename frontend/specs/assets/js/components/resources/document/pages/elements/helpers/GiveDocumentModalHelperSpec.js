import Modal from 'react-bootstrap/cjs/Modal.js';
import GiveDocumentModalHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/helpers/GiveDocumentModalHelper.jsx';
import DocumentReceivingRowHelper
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/helpers/DocumentReceivingRowHelper.jsx';
import TwoColumnLayout
  from '../../../../../../../../../assets/js/components/common/layout/TwoColumnLayout.jsx';
import { findElement } from './support.js';

describe('GiveDocumentModalHelper', function() {
  const buildState = (overrides = {}) => ({
    activeTab: 'pcs',
    browse: {
      items: [{ id: 1, name: 'Aria' }], page: 1, pages: 1, loading: false, error: '',
    },
    search: '',
    receiving: [],
    submitting: false,
    ...overrides,
  });

  const buildHandlers = () => ({
    onTabChange: jasmine.createSpy('onTabChange'),
    onSearchChange: jasmine.createSpy('onSearchChange'),
    onPrev: jasmine.createSpy('onPrev'),
    onNext: jasmine.createSpy('onNext'),
    onSelectCharacter: jasmine.createSpy('onSelectCharacter'),
    onRemove: jasmine.createSpy('onRemove'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onClear: jasmine.createSpy('onClear'),
    onClose: jasmine.createSpy('onClose'),
  });

  describe('.render', function() {
    it('renders the modal title', function() {
      const element = GiveDocumentModalHelper.render(true, buildState(), buildHandlers());
      const title = findElement(element, (node) => node.type === Modal.Title);

      expect(title.props.children).toBe('Give Document');
    });

    it('renders the pc/npc tabs', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ activeTab: 'npcs' }), buildHandlers());

      expect(JSON.stringify(element)).toContain('PCs');
      expect(JSON.stringify(element)).toContain('NPCs');
    });

    it('binds the search input value and onChange handler', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState({ search: 'ar' }), handlers);
      const input = findElement(element, (node) => node.type === 'input' && node.props.type === 'text');

      expect(input.props.value).toBe('ar');

      input.props.onChange({ target: { value: 'aria' } });

      expect(handlers.onSearchChange).toHaveBeenCalledWith('aria');
    });

    it('renders the loading message when browsing', function() {
      const element = GiveDocumentModalHelper.render(
        true, buildState({ browse: { items: [], page: 1, pages: 1, loading: true, error: '' } }), buildHandlers(),
      );

      expect(JSON.stringify(element)).toContain('Loading characters...');
    });

    it('renders the load error message when browsing fails', function() {
      const element = GiveDocumentModalHelper.render(
        true,
        buildState({
          browse: {
            items: [], page: 1, pages: 1, loading: false, error: 'give_document_modal.load_error',
          },
        }),
        buildHandlers(),
      );

      expect(JSON.stringify(element)).toContain('Unable to load characters. Please try again.');
    });

    it('renders a browse-list entry per character and invokes onSelectCharacter when clicked', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState(), handlers);
      const entry = findElement(element, (node) => node.type === 'button' && node.key === '1');

      entry.props.onClick();

      expect(handlers.onSelectCharacter).toHaveBeenCalledWith({ id: 1, name: 'Aria' });
    });

    it('passes a null detailPane to TwoColumnLayout when the receiving list is empty', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ receiving: [] }), buildHandlers());
      const layout = findElement(element, (node) => node.type === TwoColumnLayout);

      expect(layout.props.detailPane).toBeNull();
    });

    it('renders the receiving list through DocumentReceivingRowHelper when non-empty', function() {
      const row = {
        character: { id: 1, name: 'Aria' }, kind: 'pcs', owned: false, result: null,
      };
      spyOn(DocumentReceivingRowHelper, 'render').and.returnValue(null);

      GiveDocumentModalHelper.render(true, buildState({ receiving: [row] }), buildHandlers());

      expect(DocumentReceivingRowHelper.render).toHaveBeenCalledWith(row, jasmine.any(Object));
    });

    it('passes a non-null detailPane to TwoColumnLayout when the receiving list is non-empty', function() {
      const row = {
        character: { id: 1, name: 'Aria' }, kind: 'pcs', owned: false, result: null,
      };
      const element = GiveDocumentModalHelper.render(true, buildState({ receiving: [row] }), buildHandlers());
      const layout = findElement(element, (node) => node.type === TwoColumnLayout);

      expect(layout.props.detailPane).not.toBeNull();
    });

    it('disables clear/cancel/submit while submitting', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ submitting: true }), buildHandlers());
      const buttons = ['Clear', 'Cancel', 'Submit'].map(
        (label) => findElement(element, (node) => node.type === 'button' && node.props.children === label),
      );

      buttons.forEach((button) => expect(button.props.disabled).toBe(true));
    });

    it('disables submit when the receiving list is empty, even when not submitting', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ receiving: [] }), buildHandlers());
      const submitButton = findElement(element, (node) => node.type === 'button' && node.props.children === 'Submit');

      expect(submitButton.props.disabled).toBe(true);
    });

    it('enables submit when the receiving list is non-empty and not submitting', function() {
      const row = {
        character: { id: 1, name: 'Aria' }, kind: 'pcs', owned: false, result: null,
      };
      const element = GiveDocumentModalHelper.render(true, buildState({ receiving: [row] }), buildHandlers());
      const submitButton = findElement(element, (node) => node.type === 'button' && node.props.children === 'Submit');

      expect(submitButton.props.disabled).toBe(false);
    });

    it('does not render the modal close button while submitting', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ submitting: true }), buildHandlers());
      const header = findElement(element, (node) => node.type === Modal.Header);

      expect(header.props.closeButton).toBe(false);
    });

    it('renders the modal close button when not submitting', function() {
      const element = GiveDocumentModalHelper.render(true, buildState({ submitting: false }), buildHandlers());
      const header = findElement(element, (node) => node.type === Modal.Header);

      expect(header.props.closeButton).toBe(true);
    });

    it('invokes onClose when Cancel is clicked', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState(), handlers);
      const cancelButton = findElement(element, (node) => node.type === 'button' && node.props.children === 'Cancel');

      cancelButton.props.onClick();

      expect(handlers.onClose).toHaveBeenCalled();
    });

    it('invokes onClear when Clear is clicked', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState(), handlers);
      const clearButton = findElement(element, (node) => node.type === 'button' && node.props.children === 'Clear');

      clearButton.props.onClick();

      expect(handlers.onClear).toHaveBeenCalled();
    });

    it('invokes onSubmit when Submit is clicked', function() {
      const handlers = buildHandlers();
      const row = {
        character: { id: 1, name: 'Aria' }, kind: 'pcs', owned: false, result: null,
      };
      const element = GiveDocumentModalHelper.render(true, buildState({ receiving: [row] }), handlers);
      const submitButton = findElement(element, (node) => node.type === 'button' && node.props.children === 'Submit');

      submitButton.props.onClick();

      expect(handlers.onSubmit).toHaveBeenCalled();
    });

    it('does not call onClose when hiding the modal while submitting', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState({ submitting: true }), handlers);

      element.props.onHide();

      expect(handlers.onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when hiding the modal while not submitting', function() {
      const handlers = buildHandlers();
      const element = GiveDocumentModalHelper.render(true, buildState({ submitting: false }), handlers);

      element.props.onHide();

      expect(handlers.onClose).toHaveBeenCalled();
    });
  });
});
