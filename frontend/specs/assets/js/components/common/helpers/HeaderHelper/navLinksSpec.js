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

    it('renders a Treasures nav link when the user is a superuser', function() {
      const html = render({ isSuperUser: true });

      expect(html).toContain('href="#/treasures"');
      expect(html).toContain('Treasures');
    });

    it('renders a Treasures nav link when the user is staff', function() {
      const html = render({ isStaff: true });

      expect(html).toContain('href="#/treasures"');
      expect(html).toContain('Treasures');
    });

    it('does not render the Treasures nav link when the user is neither staff nor a superuser', function() {
      const html = render({ isSuperUser: false, isStaff: false });

      expect(html).not.toContain('href="#/treasures"');
    });

    it('renders a Staff Users nav link when the user is a superuser', function() {
      const html = render({ isSuperUser: true });

      expect(html).toContain('href="#/staff/users"');
      expect(html).toContain('Users');
    });

    it('renders a Staff Users nav link when the user is staff', function() {
      const html = render({ isStaff: true });

      expect(html).toContain('href="#/staff/users"');
    });

    it('does not render the Staff Users nav link when the user is neither staff nor a superuser', function() {
      const html = render({ isSuperUser: false, isStaff: false });

      expect(html).not.toContain('href="#/staff/users"');
    });
  });
});
