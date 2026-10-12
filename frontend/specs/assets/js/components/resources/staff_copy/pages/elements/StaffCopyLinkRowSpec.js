import StaffCopyLinkRow, {
  linkEntityLabel, linkErrorText,
} from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyLinkRow.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyLinkRow', function() {
  describe('linkErrorText', function() {
    it('prefers the local error', function() {
      expect(linkErrorText({ status: 'failed', error: 'permission' }, 'staff_copies_page.link_error.in_flight'))
        .toBe(Translator.t('staff_copies_page.link_error.in_flight'));
    });

    it('translates the backend error of a failed link', function() {
      ['source_missing', 'path_rejected', 'cross_device', 'target_exists', 'permission'].forEach((code) => {
        expect(linkErrorText({ status: 'failed', error: code }, null))
          .toBe(Translator.t(`staff_copies_page.link_error.${code}`));
      });
    });

    it('maps an unknown code to unknown', function() {
      expect(linkErrorText({ status: 'failed', error: 'weird' }, null))
        .toBe(Translator.t('staff_copies_page.link_error.unknown'));
    });

    it('is empty for a pending link', function() {
      expect(linkErrorText({ status: 'pending', error: null }, null)).toBe('');
    });
  });

  describe('linkEntityLabel', function() {
    it('appends the type label when known', function() {
      expect(linkEntityLabel({ name: 'Sword', type: 'items' })).toBe(`Sword (${Translator.t('staff_copies_page.types.items')})`);
    });

    it('returns the bare name otherwise', function() {
      expect(linkEntityLabel({ name: 'Sword' })).toBe('Sword');
    });
  });

  it('renders each status label', function() {
    ['pending', 'failed'].forEach((status) => {
      const row = StaffCopyLinkRow({
        link: { upload_id: 1, upload_type: 'image', status, entity: { name: 'A' } }, retrying: false, localError: null, onRetry: null,
      });

      expect(row.props.children[2].props.children).toBe(Translator.t(`staff_copies_page.link_status.${status}`));
    });
  });

  it('calls onRetry with the link', function() {
    const onRetry = jasmine.createSpy('onRetry');
    const link = { upload_id: 1, upload_type: 'file', status: 'failed', error: null };
    const row = StaffCopyLinkRow({
      link, retrying: false, localError: null, onRetry,
    });

    row.props.children[4].props.children.props.onClick();

    expect(onRetry).toHaveBeenCalledWith(link);
    expect(row.props.children[0].props.children).toBe('');
  });
});
