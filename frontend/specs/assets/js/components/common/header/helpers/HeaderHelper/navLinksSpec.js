import { render } from './support.js';

describe('HeaderHelper', function() {
  describe('.render', function() {
    it('renders a home link on the title', function() {
      const html = render();

      expect(html).toContain('href="#/"');
      expect(html).toContain('Majora');
    });

    it('renders a Games nav link', function() {
      const html = render();

      expect(html).toContain('href="#/games"');
      expect(html).toContain('Games');
    });

    describe('admin nav dropdown', function() {
      it('renders the Admin dropdown with Treasures/Staff Users/Dashboard items when the user is a superuser', function() {
        const html = render({ isSuperUser: true });

        expect(html).toContain('Admin');
        expect(html).toContain('href="#/treasures"');
        expect(html).toContain('Treasures');
        expect(html).toContain('href="#/staff/users"');
        expect(html).toContain('Users');
        expect(html).toContain('href="#/staff/dashboard"');
        expect(html).toContain('Dashboard');
      });

      it('renders the Admin dropdown with Treasures/Staff Users/Dashboard items when the user is staff', function() {
        const html = render({ isStaff: true });

        expect(html).toContain('Admin');
        expect(html).toContain('href="#/treasures"');
        expect(html).toContain('href="#/staff/users"');
        expect(html).toContain('href="#/staff/dashboard"');
      });

      it('does not render the Admin dropdown when the user is neither staff nor a superuser', function() {
        const html = render({ isSuperUser: false, isStaff: false });

        expect(html).not.toContain('href="#/treasures"');
        expect(html).not.toContain('href="#/staff/users"');
        expect(html).not.toContain('href="#/staff/dashboard"');
      });
    });
  });
});
