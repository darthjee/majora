import { renderToStaticMarkup } from 'react-dom/server';
import TreasureCardHelper from '../../../../../../assets/js/components/common/helpers/TreasureCardHelper.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('TreasureCardHelper', function() {
  const treasure = { id: 42, name: 'Golden Crown', value: 500 };

  describe('.render', function() {
    it('renders the treasure name', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('Golden Crown');
    });

    it('renders the treasure value as a coin breakdown', function() {
      expect(renderToStaticMarkup(TreasureCardHelper.render(treasure)))
        .toContain('5 GP');
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

    it('does not render the upload button when canManage is false', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure, false, Noop.noop));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render the upload button when canManage is omitted', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the upload button when canManage is true', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure, true, Noop.noop));
      expect(html).toContain('actions-overlay-button');
    });

    it('invokes onUploadClick with the treasure when the upload button is clicked', function() {
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const rendered = TreasureCardHelper.render(treasure, true, onUploadClick);
      const overlay = rendered.props.children.props.children[0];

      overlay.props.onClick();

      expect(onUploadClick).toHaveBeenCalledWith(treasure);
    });

    it('does not render the edit link when editHref is omitted', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure, true, Noop.noop));
      expect(html).not.toContain('card-action-link');
    });

    it('does not render the edit link when canManage is false', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, false, Noop.noop, '#/games/demo/treasures/42/edit')
      );
      expect(html).not.toContain('card-action-link');
    });

    it('renders the edit link when canManage is true and editHref is present', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, true, Noop.noop, '#/games/demo/treasures/42/edit')
      );
      expect(html).toContain('card-action-link');
      expect(html).toContain('href="#/games/demo/treasures/42/edit"');
    });

    it('does not render a quantity badge when quantity is omitted', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).not.toContain('×');
    });

    it('does not render a quantity badge when quantity is 1', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, false, Noop.noop, '', 1)
      );
      expect(html).not.toContain('×');
    });

    it('does not render a quantity badge when quantity is 0', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, false, Noop.noop, '', 0)
      );
      expect(html).not.toContain('×');
    });

    it('renders a quantity badge when quantity is greater than 1', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, false, Noop.noop, '', 5)
      );
      expect(html).toContain('×5');
      expect(html).toContain('badge');
    });

    it('renders the quantity badge through the overlay info bar', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render(treasure, false, Noop.noop, '', 5)
      );
      expect(html).toContain('info-overlay');
      expect(html).not.toContain('position-absolute top-0 end-0 m-2');
    });

    it('does not render an availability line when max_units is absent', function() {
      const html = renderToStaticMarkup(TreasureCardHelper.render(treasure));
      expect(html).not.toContain('Available:');
    });

    it('does not render an availability line when max_units is null', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render({ ...treasure, available_units: null, max_units: null })
      );
      expect(html).not.toContain('Available:');
    });

    it('renders the available/max units line when max_units is present', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render({ ...treasure, available_units: 3, max_units: 10 })
      );
      expect(html).toContain('Available: 3 / 10');
    });

    it('renders the available/max units line even when available_units is 0', function() {
      const html = renderToStaticMarkup(
        TreasureCardHelper.render({ ...treasure, available_units: 0, max_units: 10 })
      );
      expect(html).toContain('Available: 0 / 10');
    });
  });
});
