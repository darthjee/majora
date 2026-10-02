import resourceConfig from '../../../../../assets/js/utils/requests/resourceConfig.js';

describe('resourceConfig staffPhoto (issue #1473)', function() {
  it('resolves GET.index as a single un-branched variant', function() {
    const index = resourceConfig.get('GET', 'staffPhoto', 'index');

    expect(index.regular).toBe(index.private);
    expect(index.regular.path()).toBe('/staff/photos.json');
    expect(index.regular.permission).toBeNull();
  });

  it('resolves GET.collection with the photo type in the path', function() {
    const collection = resourceConfig.get('GET', 'staffPhoto', 'collection');

    expect(collection.regular).toBe(collection.private);
    expect(collection.regular.path({ photoType: 'game_item' })).toBe('/staff/photos/game_item.json');
    expect(collection.regular.permission).toBeNull();
  });

  it('resolves DELETE.single with the photo type and id in the path', function() {
    const single = resourceConfig.get('DELETE', 'staffPhoto', 'single');

    expect(single.regular).toBe(single.private);
    expect(single.regular.path({ photoType: 'character', id: 12 })).toBe('/staff/photos/character/12.json');
    expect(single.regular.permission).toBeNull();
  });

  it('returns null for an unconfigured quantity type', function() {
    expect(resourceConfig.get('GET', 'staffPhoto', 'single')).toBeNull();
  });
});
