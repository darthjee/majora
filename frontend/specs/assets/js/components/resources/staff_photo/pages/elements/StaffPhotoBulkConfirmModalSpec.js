import StaffPhotoBulkConfirmModal from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoBulkConfirmModal.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoBulkConfirmModal', function() {
  const onConfirm = () => 'confirm';
  const onCancel = () => 'cancel';
  const photos = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('shows the bulk resize confirmation with the count and max', function() {
    const { props } = StaffPhotoBulkConfirmModal({
      pending: { action: 'resize', photos }, maxDimension: 800, onConfirm, onCancel,
    });

    expect(props.show).toBe(true);
    expect(props.title).toBe(Translator.t('staff_photos_page.bulk_confirm_resize_title'));
    expect(props.body).toBe(Translator.t('staff_photos_page.bulk_confirm_resize_body')
      .replace('{{count}}', 3).replace('{{max}}', 800));
    expect(props.variant).toBe('primary');
    expect(props.onConfirm).toBe(onConfirm);
    expect(props.onCancel).toBe(onCancel);
  });

  it('shows the bulk delete confirmation with the danger variant', function() {
    const { props } = StaffPhotoBulkConfirmModal({
      pending: { action: 'delete', photos }, maxDimension: 800, onConfirm, onCancel,
    });

    expect(props.title).toBe(Translator.t('staff_photos_page.bulk_confirm_delete_title'));
    expect(props.body).toBe(Translator.t('staff_photos_page.bulk_confirm_delete_body').replace('{{count}}', 3));
    expect(props.variant).toBe('danger');
  });

  it('is hidden without a pending job', function() {
    const { props } = StaffPhotoBulkConfirmModal({
      pending: null, maxDimension: 800, onConfirm, onCancel,
    });

    expect(props.show).toBe(false);
  });
});
