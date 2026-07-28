import CharacterEditFieldsBuilder
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterEditFieldsBuilder.js';

describe('CharacterEditFieldsBuilder', function() {
  describe('.fieldsFromCharacter', function() {
    it('seeds every field from a fully-loaded character', function() {
      const links = [{ id: 9, text: 'Wiki', url: 'https://example.com/wiki', link_type: '' }];
      const character = {
        name: 'Aragorn',
        role: 'Ranger',
        public_description: 'King',
        private_description: 'Secret',
        money: 310,
        private_allegiance: 'ally',
        public_allegiance: 'enemy',
        public_slain: true,
        hidden: true,
        incognito: true,
        links,
      };

      expect(CharacterEditFieldsBuilder.fieldsFromCharacter(character)).toEqual({
        name: 'Aragorn',
        role: 'Ranger',
        public_description: 'King',
        private_description: 'Secret',
        money: '310',
        private_allegiance: 'ally',
        public_allegiance: 'enemy',
        public_slain: true,
        hidden: true,
        incognito: true,
        links,
      });
    });

    it('defaults missing fields to empty strings, "0" money, "neutral" allegiances, false slain/hidden/incognito, and no links', function() {
      expect(CharacterEditFieldsBuilder.fieldsFromCharacter({})).toEqual({
        name: '',
        role: '',
        public_description: '',
        private_description: '',
        money: '0',
        private_allegiance: 'neutral',
        public_allegiance: 'neutral',
        public_slain: false,
        hidden: false,
        incognito: false,
        links: [],
      });
    });

    it('falls back private_allegiance to public_allegiance when absent', function() {
      const fields = CharacterEditFieldsBuilder.fieldsFromCharacter({ public_allegiance: 'enemy', public_slain: true });

      expect(fields.private_allegiance).toBe('enemy');
      expect(fields.public_slain).toBe(true);
    });
  });

  describe('.fullEditorFields', function() {
    const formValues = {
      name: 'Aragorn',
      role: 'Ranger',
      description: 'King',
      privateDescription: 'Secret',
      money: '310',
      privateAllegiance: 'ally',
      publicAllegiance: 'enemy',
      publicSlain: true,
      hidden: true,
      incognito: true,
      links: [{ id: 9, text: 'Wiki', url: 'https://example.com/wiki', link_type: '' }],
    };

    it('builds the full fields object, without allegiance keys, for a pc', function() {
      expect(CharacterEditFieldsBuilder.fullEditorFields(formValues, 'pcs')).toEqual({
        name: 'Aragorn',
        role: 'Ranger',
        public_description: 'King',
        private_description: 'Secret',
        money: 310,
        links: [{
          id: 9, text: 'Wiki', url: 'https://example.com/wiki', link_type: '', delete: false,
        }],
      });
    });

    it('adds private_allegiance, public_allegiance, public_slain, hidden, and incognito for an npc', function() {
      const fields = CharacterEditFieldsBuilder.fullEditorFields(formValues, 'npcs');

      expect(fields.private_allegiance).toBe('ally');
      expect(fields.public_allegiance).toBe('enemy');
      expect(fields.public_slain).toBe(true);
      expect(fields.hidden).toBe(true);
      expect(fields.incognito).toBe(true);
    });
  });

  describe('.playerFields', function() {
    it('builds the reduced player-only NPC editor payload', function() {
      const formValues = {
        name: 'Grumbleknuckle',
        role: 'Shopkeeper',
        description: 'A brave hero',
        publicAllegiance: 'enemy',
        publicSlain: true,
        hidden: true,
        incognito: true,
        links: [{ text: '', url: 'https://example.com/new-link', link_type: '' }],
      };

      expect(CharacterEditFieldsBuilder.playerFields(formValues)).toEqual({
        name: 'Grumbleknuckle',
        role: 'Shopkeeper',
        public_description: 'A brave hero',
        public_allegiance: 'enemy',
        links: [{
          text: 'https://example.com/new-link', url: 'https://example.com/new-link', link_type: '', delete: false,
        }],
        public_slain: true,
      });
    });

    it('never includes incognito in the player-only NPC editor payload', function() {
      const formValues = {
        name: 'Grumbleknuckle',
        role: 'Shopkeeper',
        description: 'A brave hero',
        publicAllegiance: 'enemy',
        publicSlain: true,
        incognito: true,
        links: [],
      };

      expect(Object.keys(CharacterEditFieldsBuilder.playerFields(formValues))).not.toContain('incognito');
    });
  });

  describe('.linksPayload', function() {
    it('defaults blank text to the url, keeps id only for persisted links, and normalizes delete', function() {
      const links = [
        { id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio' },
        { text: '', url: 'https://example.com/new-link', link_type: '' },
        { id: 7, text: 'Old', url: 'https://example.com/old', delete: true },
      ];

      expect(CharacterEditFieldsBuilder.linksPayload(links)).toEqual([
        {
          id: 12, text: 'Loot table', url: 'https://example.com/loot', link_type: 'lootstudio', delete: false,
        },
        { text: 'https://example.com/new-link', url: 'https://example.com/new-link', link_type: '', delete: false },
        {
          id: 7, text: 'Old', url: 'https://example.com/old', link_type: '', delete: true,
        },
      ]);
    });

    it('defaults to an empty array when no links are given', function() {
      expect(CharacterEditFieldsBuilder.linksPayload()).toEqual([]);
    });
  });
});
