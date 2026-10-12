import Modal from 'react-bootstrap/cjs/Modal.js';
import StaffCopyConfirmModal from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyConfirmModal.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyConfirmModal', function() {
  let props;

  beforeEach(function() {
    props = { show: true, onConfirm: jasmine.createSpy('onConfirm'), onCancel: jasmine.createSpy('onCancel') };
  });

  it('renders the re-copy title, body and buttons', function() {
    const element = StaffCopyConfirmModal(props);
    const [header, body, footer] = element.props.children;
    const [cancel, confirm] = footer.props.children;

    expect(element.type).toBe(Modal);
    expect(element.props.show).toBe(true);
    expect(element.props.onHide).toBe(props.onCancel);
    expect(header.props.children.props.children).toBe(Translator.t('staff_copies_page.recopy_confirm_title'));
    expect(body.props.children).toBe(Translator.t('staff_copies_page.recopy_confirm_body'));
    expect(cancel.props.children).toBe(Translator.t('staff_copies_page.recopy_confirm_cancel'));
    expect(confirm.props.children).toBe(Translator.t('staff_copies_page.recopy_confirm_accept'));
  });

  it('wires the confirm and cancel buttons', function() {
    const [, , footer] = StaffCopyConfirmModal(props).props.children;
    const [cancel, confirm] = footer.props.children;

    cancel.props.onClick();
    confirm.props.onClick();

    expect(props.onCancel).toHaveBeenCalled();
    expect(props.onConfirm).toHaveBeenCalled();
  });
});
