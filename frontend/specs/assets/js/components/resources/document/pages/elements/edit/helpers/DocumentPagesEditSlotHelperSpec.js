import { renderToStaticMarkup } from 'react-dom/server';
import DocumentPagesEditSlotHelper
  from '../../../../../../../../../../assets/js/components/resources/document/pages/elements/edit/helpers/DocumentPagesEditSlotHelper.jsx';

describe('DocumentPagesEditSlotHelper', function() {
  const buildBox = (overrides = {}) => ({
    gameSlug: 'demo', id: 9, canEditPages: true, pagesRef: { current: null }, ...overrides,
  });

  const buildSave = (overrides = {}) => ({
    saveStatus: 'idle',
    onSave: jasmine.createSpy('onSave'),
    onRetrySave: jasmine.createSpy('onRetrySave'),
    onSkipSave: jasmine.createSpy('onSkipSave'),
    ...overrides,
  });

  describe('.render', function() {
    it('always renders the pages editor (read-only "Edit pages" affordance by default)', function() {
      const html = renderToStaticMarkup(DocumentPagesEditSlotHelper.render(buildBox(), buildSave()));

      expect(html).toContain('Edit pages');
    });

    it('does not render the Save button when canEditPages is false', function() {
      const html = renderToStaticMarkup(
        DocumentPagesEditSlotHelper.render(buildBox({ canEditPages: false }), buildSave()),
      );

      expect(html).not.toContain('>Save<');
    });

    it('renders an enabled Save button wired to onSave when canEditPages is true', function() {
      const save = buildSave();
      const element = DocumentPagesEditSlotHelper.render(buildBox(), save);
      const [, saveButton] = element.props.children;

      expect(saveButton.props.onClick).toBe(save.onSave);
      expect(saveButton.props.disabled).toBe(false);

      const html = renderToStaticMarkup(element);
      expect(html).toContain('>Save<');
    });

    it('disables the Save button while saving', function() {
      const element = DocumentPagesEditSlotHelper.render(buildBox(), buildSave({ saveStatus: 'saving' }));
      const [, saveButton] = element.props.children;

      expect(saveButton.props.disabled).toBe(true);
    });

    it('does not render the pages-save-failed alert when saveStatus is not "failed"', function() {
      const html = renderToStaticMarkup(
        DocumentPagesEditSlotHelper.render(buildBox(), buildSave({ saveStatus: 'idle' })),
      );

      expect(html).not.toContain('alert-warning');
    });

    it('renders the pages-save-failed alert wired to onRetrySave/onSkipSave when saveStatus is "failed"', function() {
      const save = buildSave({ saveStatus: 'failed' });
      const element = DocumentPagesEditSlotHelper.render(buildBox(), save);
      const [, , failedAlert] = element.props.children;

      expect(failedAlert.props.onRetry).toBe(save.onRetrySave);
      expect(failedAlert.props.onSkip).toBe(save.onSkipSave);

      const html = renderToStaticMarkup(element);
      expect(html).toContain('alert-warning');
    });

    it('forwards the ref, gameSlug, id and canEditPages to the pages editor', function() {
      const pagesRef = { current: null };
      const element = DocumentPagesEditSlotHelper.render(
        buildBox({
          gameSlug: 'epic-quest', id: 42, canEditPages: false, pagesRef,
        }),
        buildSave(),
      );
      const [pagesEditBox] = element.props.children;

      expect(pagesEditBox.props.ref).toBe(pagesRef);
      expect(pagesEditBox.props.gameSlug).toBe('epic-quest');
      expect(pagesEditBox.props.id).toBe(42);
      expect(pagesEditBox.props.canEditPages).toBe(false);
    });
  });
});
