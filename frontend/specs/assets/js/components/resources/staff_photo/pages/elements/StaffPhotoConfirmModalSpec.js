import Modal from 'react-bootstrap/cjs/Modal.js';
import StaffPhotoConfirmModal from '../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/StaffPhotoConfirmModal.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoConfirmModal', function() {
  let props;

  /**
   * @description Splits the modal element into its parts.
   * @param {object} element - Modal element.
   * @returns {{header: object, body: object, cancel: object, confirm: object}} The parts.
   */
  function parts(element) {
    const [header, body, footer] = element.props.children;
    const [cancel, confirm] = footer.props.children;

    return {
      header, body, cancel, confirm,
    };
  }

  beforeEach(function() {
    props = {
      show: true,
      title: 'Title',
      body: 'Body',
      onConfirm: jasmine.createSpy('onConfirm'),
      onCancel: jasmine.createSpy('onCancel'),
    };
  });

  it('renders a modal with the title and body', function() {
    const element = StaffPhotoConfirmModal(props);
    const { header, body } = parts(element);

    expect(element.type).toBe(Modal);
    expect(element.props.show).toBe(true);
    expect(element.props.onHide).toBe(props.onCancel);
    expect(header.props.children.props.children).toBe('Title');
    expect(body.props.children).toBe('Body');
  });

  it('wires the cancel and confirm buttons', function() {
    const { cancel, confirm } = parts(StaffPhotoConfirmModal(props));

    expect(cancel.props.children).toBe(Translator.t('staff_photos_page.cancel'));
    expect(confirm.props.children).toBe(Translator.t('staff_photos_page.confirm'));
    expect(cancel.props.onClick).toBe(props.onCancel);
    expect(confirm.props.onClick).toBe(props.onConfirm);
    expect(confirm.props.className).toBe('btn btn-primary');
  });

  it('uses the given confirm variant', function() {
    const { confirm } = parts(StaffPhotoConfirmModal({ ...props, variant: 'danger' }));

    expect(confirm.props.className).toBe('btn btn-danger');
  });
});
