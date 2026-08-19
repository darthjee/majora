import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    describe('miniatures nav dropdown', function() {
      it('renders the STL Models/Sources/Collections items when logged in', function() {
        const html = render({ loggedIn: true });

        expect(html).toContain('Miniatures');
        expect(html).toContain('href="#/miniatures/stl_models"');
        expect(html).toContain('STL Models');
        expect(html).toContain('href="#/miniatures/sources"');
        expect(html).toContain('Sources');
        expect(html).toContain('href="#/miniatures/collections"');
        expect(html).toContain('Collections');
      });

      it('does not render the miniatures nav dropdown when logged out', function() {
        const html = render({ loggedIn: false });

        expect(html).not.toContain('href="#/miniatures/stl_models"');
        expect(html).not.toContain('href="#/miniatures/sources"');
        expect(html).not.toContain('href="#/miniatures/collections"');
      });

      it('renders items in STL Models/Sources/Collections order', function() {
        const html = render({ loggedIn: true });

        const stlIndex = html.indexOf('href="#/miniatures/stl_models"');
        const sourcesIndex = html.indexOf('href="#/miniatures/sources"');
        const collectionsIndex = html.indexOf('href="#/miniatures/collections"');

        expect(stlIndex).toBeGreaterThan(-1);
        expect(sourcesIndex).toBeGreaterThan(stlIndex);
        expect(collectionsIndex).toBeGreaterThan(sourcesIndex);
      });
    });
  });
});
