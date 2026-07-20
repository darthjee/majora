import { renderToStaticMarkup } from 'react-dom/server';
import DescriptionBoxHelper
  from '../../../../../../../assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx';

describe('DescriptionBoxHelper', function() {
  const buildState = (overrides = {}) => ({
    expanded: false,
    isOverflowing: false,
    maxCollapsedHeight: 128,
    ...overrides,
  });

  const buildHandlers = (overrides = {}) => ({
    boxRef: { current: null },
    onToggle: jasmine.createSpy('onToggle'),
    ...overrides,
  });

  describe('.render', function() {
    it('returns null when description is absent', function() {
      expect(DescriptionBoxHelper.render(undefined, buildState(), buildHandlers())).toBeNull();
    });

    it('returns null when description is empty', function() {
      expect(DescriptionBoxHelper.render('', buildState(), buildHandlers())).toBeNull();
    });

    it('renders the description inside the bordered box', function() {
      const html = renderToStaticMarkup(
        DescriptionBoxHelper.render('The future king.', buildState(), buildHandlers()),
      );

      expect(html).toContain('The future king.');
      expect(html).toContain('border');
      expect(html).toContain('bg-light');
    });

    it('preserves line breaks via remark-breaks', function() {
      const html = renderToStaticMarkup(
        DescriptionBoxHelper.render('Line one.\nLine two.', buildState(), buildHandlers()),
      );

      expect(html).toContain('Line one.<br');
      expect(html).toContain('Line two.');
    });

    it('does not render a toggle button when the content does not overflow', function() {
      const html = renderToStaticMarkup(
        DescriptionBoxHelper.render('Short text.', buildState({ isOverflowing: false }), buildHandlers()),
      );

      expect(html).not.toContain('<button');
    });

    it('renders a "Show more" toggle button when the content overflows and is collapsed', function() {
      const html = renderToStaticMarkup(
        DescriptionBoxHelper.render(
          'Long text.',
          buildState({ isOverflowing: true, expanded: false }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('<button');
      expect(html).toContain('Show more');
    });

    it('renders a "Show less" toggle button when the content overflows and is expanded', function() {
      const html = renderToStaticMarkup(
        DescriptionBoxHelper.render(
          'Long text.',
          buildState({ isOverflowing: true, expanded: true }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('Show less');
    });

    it('invokes onToggle when the toggle button is clicked', function() {
      const handlers = buildHandlers();
      const element = DescriptionBoxHelper.render(
        'Long text.',
        buildState({ isOverflowing: true }),
        handlers,
      );
      const button = element.props.children[1];

      button.props.onClick();

      expect(handlers.onToggle).toHaveBeenCalled();
    });
  });
});
