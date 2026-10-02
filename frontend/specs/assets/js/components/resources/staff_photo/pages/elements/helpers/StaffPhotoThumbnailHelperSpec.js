import { renderToStaticMarkup } from 'react-dom/server';
import StaffPhotoThumbnailHelper from '../../../../../../../../../assets/js/components/resources/staff_photo/pages/elements/helpers/StaffPhotoThumbnailHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffPhotoThumbnailHelper', function() {
  describe('.render', function() {
    it('renders the image wired to the given onError handler', function() {
      const onError = jasmine.createSpy('onError');
      const element = StaffPhotoThumbnailHelper.render('/p.png', false, onError);

      element.props.onError();

      expect(element.type).toBe('img');
      expect(element.props.src).toBe('/p.png');
      expect(element.props.alt).toBe(Translator.t('staff_photos_page.thumbnail_alt'));
      expect(onError).toHaveBeenCalled();
    });

    it('renders the bi-image placeholder with an accessible label when broken', function() {
      const html = renderToStaticMarkup(StaffPhotoThumbnailHelper.render('/p.png', true, Noop.noop));

      expect(html).toContain('bi-image');
      expect(html).toContain('role="img"');
      expect(html).toContain(`aria-label="${Translator.t('staff_photos_page.broken_image_alt')}"`);
      expect(html).not.toContain('<img');
    });

    it('renders the placeholder when there is no src', function() {
      const html = renderToStaticMarkup(StaffPhotoThumbnailHelper.render(null, false, Noop.noop));

      expect(html).toContain('bi-image');
    });
  });
});
