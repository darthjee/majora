import resourceName from '../../../../../../../../assets/js/components/resources/character/pages/shared/characterResourceName.js';

describe('resourceName', function() {
  it('returns "npc" for the npcs character kind', function() {
    expect(resourceName('npcs')).toBe('npc');
  });

  it('returns "pc" for the pcs character kind', function() {
    expect(resourceName('pcs')).toBe('pc');
  });
});
