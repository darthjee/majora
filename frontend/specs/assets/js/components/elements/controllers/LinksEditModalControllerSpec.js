import LinksEditModalController
  from '../../../../../../assets/js/components/elements/controllers/LinksEditModalController.js';
import { buildLink } from '../../../../../support/factories.js';

describe('LinksEditModalController', function() {
  describe('.seedLinks', function() {
    it('clones each entry from the given links array', function() {
      const link = buildLink({ id: 1, text: 'Wiki', url: 'https://example.com' });
      const links = [link];

      const seeded = LinksEditModalController.seedLinks(links);

      expect(seeded).toEqual([link]);
      expect(seeded[0]).not.toBe(link);
      expect(seeded).not.toBe(links);
    });

    it('returns an empty array when links is null or undefined', function() {
      expect(LinksEditModalController.seedLinks(null)).toEqual([]);
      expect(LinksEditModalController.seedLinks(undefined)).toEqual([]);
    });
  });

  describe('.addLink', function() {
    it('appends a new, empty, non-persisted link entry', function() {
      const links = [buildLink({ id: 1 })];

      const result = LinksEditModalController.addLink(links);

      expect(result).toEqual([
        buildLink({ id: 1 }),
        { text: '', url: '', link_type: '' },
      ]);
    });

    it('does not mutate the given array', function() {
      const links = [];

      LinksEditModalController.addLink(links);

      expect(links).toEqual([]);
    });
  });

  describe('.updateLink', function() {
    it('merges the given changes into the entry at the given index', function() {
      const links = [
        buildLink({ id: 1, text: 'Old text' }),
        buildLink({ id: 2, text: 'Untouched' }),
      ];

      const result = LinksEditModalController.updateLink(links, 0, { text: 'New text' });

      expect(result[0]).toEqual(buildLink({ id: 1, text: 'New text' }));
      expect(result[1]).toEqual(buildLink({ id: 2, text: 'Untouched' }));
    });

    it('does not mutate the given array', function() {
      const links = [buildLink({ id: 1, text: 'Old text' })];

      LinksEditModalController.updateLink(links, 0, { text: 'New text' });

      expect(links[0].text).toBe('Old text');
    });
  });

  describe('.toggleDelete', function() {
    it('marks a persisted link as deleted without removing it', function() {
      const links = [buildLink({ id: 1 })];

      const result = LinksEditModalController.toggleDelete(links, 0);

      expect(result).toEqual([buildLink({ id: 1, delete: true })]);
    });

    it('clears the delete flag when toggled again', function() {
      const links = [buildLink({ id: 1, delete: true })];

      const result = LinksEditModalController.toggleDelete(links, 0);

      expect(result).toEqual([buildLink({ id: 1, delete: false })]);
    });

    it('removes a non-persisted link entirely', function() {
      const links = [
        { text: 'Draft', url: 'https://example.com/draft', link_type: '' },
        buildLink({ id: 2 }),
      ];

      const result = LinksEditModalController.toggleDelete(links, 0);

      expect(result).toEqual([buildLink({ id: 2 })]);
    });
  });

  describe('.canConfirm', function() {
    it('is true when every active link has a non-blank url', function() {
      const links = [buildLink({ id: 1, url: 'https://example.com' })];

      expect(LinksEditModalController.canConfirm(links)).toBe(true);
    });

    it('is false when an active link has a blank url', function() {
      const links = [{ text: '', url: '', link_type: '' }];

      expect(LinksEditModalController.canConfirm(links)).toBe(false);
    });

    it('ignores blank urls on links marked for deletion', function() {
      const links = [buildLink({ id: 1, url: '', delete: true })];

      expect(LinksEditModalController.canConfirm(links)).toBe(true);
    });

    it('is true for an empty links array', function() {
      expect(LinksEditModalController.canConfirm([])).toBe(true);
    });
  });
});
