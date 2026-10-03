import StaffPhotoResizeConfirmModal from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoResizeConfirmModal.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoResizeConfirmModal', function() {
  const onConfirm = () => 'confirm';
  const onCancel = () => 'cancel';

  it('shows the resize confirmation with the max dimension', function() {
    const { props } = StaffPhotoResizeConfirmModal({
      photo: { id: 1 }, maxDimension: 1024, onConfirm, onCancel,
    });

    expect(props.show).toBe(true);
    expect(props.title).toBe(Translator.t('staff_photos_page.resize_confirm_title'));
    expect(props.body).toBe(Translator.t('staff_photos_page.resize_confirm_body').replace('{{max}}', 1024));
    expect(props.body).toContain('1024');
    expect(props.onConfirm).toBe(onConfirm);
    expect(props.onCancel).toBe(onCancel);
  });

  it('is hidden without a pending photo', function() {
    const { props } = StaffPhotoResizeConfirmModal({
      photo: null, maxDimension: 1024, onConfirm, onCancel,
    });

    expect(props.show).toBe(false);
  });
});
