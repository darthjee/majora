import { renderToStaticMarkup } from 'react-dom/server';
import TreasureCardHelper from '../../../../../../assets/js/components/elements/helpers/TreasureCardHelper.jsx';

describe('TreasureCardHelper', function() {
  const treasure = { id: 42, name: 'Golden Crown', value: 500 };

  describe('.render', function() {
    it('renders the treasure name', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('Golden Crown');
    });

    it('renders the treasure value', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('500');
    });

    it('links to the treasure detail page', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('href="#/treasures/42"');
    });

    it('renders the treasure title link with the stretched-link utility', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('stretched-link');
    });

    it('renders the default treasure image when no photo_path is present', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('<img');
      expect(html).toContain('default_treasure.png');
    });

    it('renders the treasure photo when photo_path is present', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render({ ...treasure, photo_path: '/photos/treasures/42/photo.png' })
      );
      expect(html).toContain('src="/photos/treasures/42/photo.png"');
      expect(html).not.toContain('default_treasure.png');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('card');
      expect(html).toContain('card-body');
      expect(html).toContain('card-title');
    });

    it('applies the 6-per-row column classes at lg', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('uses the treasure name as the image alt text', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).toContain('alt="Golden Crown"');
    });

    it('does not render the upload button when isSuperUser is false', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure, false, () => {}));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('does not render the upload button when isSuperUser is omitted', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('renders the upload button when isSuperUser is true', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure, true, () => {}));
      expect(html).toContain('photo-upload-overlay-button');
    });

    it('invokes onUploadClick with the treasure when the upload button is clicked', function() {
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const rendered = TreasureCardHelper.render(treasure, true, onUploadClick);
      const overlay = rendered.props.children.props.children[0];

      overlay.props.onClick();

      expect(onUploadClick).toHaveBeenCalledWith(treasure);
    });
  });
});
