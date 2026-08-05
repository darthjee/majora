import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TwoColumnLayoutHelper
  from '../../../../../../../assets/js/components/common/layout/helpers/TwoColumnLayoutHelper.jsx';

describe('TwoColumnLayoutHelper', function() {
  describe('.render', function() {
    it('renders only the browse pane when no detail pane is given', function() {
      const html = renderToStaticMarkup(
        TwoColumnLayoutHelper.render(React.createElement('div', null, 'browse')),
      );

      expect(html).toBe('<div>browse</div>');
    });

    it('renders only the browse pane when the detail pane is null', function() {
      const html = renderToStaticMarkup(
        TwoColumnLayoutHelper.render(React.createElement('div', null, 'browse'), null),
      );

      expect(html).toBe('<div>browse</div>');
    });

    it('wraps both panes in a row/col-6 layout when a detail pane is given', function() {
      const html = renderToStaticMarkup(TwoColumnLayoutHelper.render(
        React.createElement('div', null, 'browse'),
        React.createElement('div', null, 'detail'),
      ));

      expect(html).toContain('class="row"');
      expect(html).toContain('class="col-6"');
      expect(html).toContain('browse');
      expect(html).toContain('detail');
    });
  });
});
