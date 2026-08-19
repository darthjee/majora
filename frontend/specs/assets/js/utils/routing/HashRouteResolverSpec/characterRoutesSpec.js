import { runCases } from './support.js';

const CASES = [
  { hash: '#/games/campaign/pcs/7', expected: 'pcCharacter' },
  { hash: '#/games/campaign/pcs/7/edit', expected: 'pcCharacterEdit' },
  {
    hash: '#/games/campaign/pcs/7/photos',
    expected: 'pcCharacterPhotos',
    description: 'resolves /games/:game_slug/pcs/:character_id/photos to pcCharacterPhotos, not pcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7/photos',
    expected: 'npcCharacterPhotos',
    description: 'resolves /games/:game_slug/npcs/:character_id/photos to npcCharacterPhotos, not npcCharacter',
  },
  {
    hash: '#/games/campaign/pcs/7/treasures',
    expected: 'pcCharacterTreasures',
    description: 'resolves /games/:game_slug/pcs/:character_id/treasures to pcCharacterTreasures, not pcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7/treasures',
    expected: 'npcCharacterTreasures',
    description: 'resolves /games/:game_slug/npcs/:character_id/treasures to npcCharacterTreasures, not npcCharacter',
  },
  {
    hash: '#/games/campaign/pcs/7/items',
    expected: 'pcCharacterItems',
    description: 'resolves /games/:game_slug/pcs/:character_id/items to pcCharacterItems, not pcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7/items',
    expected: 'npcCharacterItems',
    description: 'resolves /games/:game_slug/npcs/:character_id/items to npcCharacterItems, not npcCharacter',
  },
  {
    hash: '#/games/campaign/pcs/7/items/new',
    expected: 'pcCharacterItemNew',
    description: 'resolves /games/:game_slug/pcs/:character_id/items/new to pcCharacterItemNew, not pcCharacterItems',
  },
  {
    hash: '#/games/campaign/npcs/7/items/new',
    expected: 'npcCharacterItemNew',
    description:
      'resolves /games/:game_slug/npcs/:character_id/items/new to npcCharacterItemNew, not npcCharacterItems',
  },
  {
    hash: '#/games/campaign/pcs/7/items/5',
    expected: 'pcCharacterItem',
    description: 'resolves /games/:game_slug/pcs/:character_id/items/:id to pcCharacterItem, not pcCharacterItems',
  },
  {
    hash: '#/games/campaign/npcs/7/items/5',
    expected: 'npcCharacterItem',
    description: 'resolves /games/:game_slug/npcs/:character_id/items/:id to npcCharacterItem, not npcCharacterItems',
  },
  {
    hash: '#/games/campaign/pcs/7/items/5/edit',
    expected: 'pcCharacterItemEdit',
    description:
      'resolves /games/:game_slug/pcs/:character_id/items/:id/edit to pcCharacterItemEdit, not pcCharacterItem',
  },
  {
    hash: '#/games/campaign/npcs/7/items/5/edit',
    expected: 'npcCharacterItemEdit',
    description:
      'resolves /games/:game_slug/npcs/:character_id/items/:id/edit to npcCharacterItemEdit, not npcCharacterItem',
  },
  {
    hash: '#/games/campaign/pcs/7/items/new',
    expected: 'pcCharacterItemNew',
    description:
      'still resolves /games/:game_slug/pcs/:character_id/items/new to pcCharacterItemNew, not pcCharacterItem',
  },
  {
    hash: '#/games/campaign/npcs/7/items/new',
    expected: 'npcCharacterItemNew',
    description:
      'still resolves /games/:game_slug/npcs/:character_id/items/new to npcCharacterItemNew, not npcCharacterItem',
  },
  {
    hash: '#/games/campaign/pcs/7/documents',
    expected: 'pcCharacterDocuments',
    description: 'resolves /games/:game_slug/pcs/:character_id/documents to pcCharacterDocuments, not pcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7/documents',
    expected: 'npcCharacterDocuments',
    description: 'resolves /games/:game_slug/npcs/:character_id/documents to npcCharacterDocuments, not npcCharacter',
  },
  {
    hash: '#/games/campaign/pcs/7/factions',
    expected: 'pcCharacterFactions',
    description: 'resolves /games/:game_slug/pcs/:character_id/factions to pcCharacterFactions, not pcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7/factions',
    expected: 'npcCharacterFactions',
    description: 'resolves /games/:game_slug/npcs/:character_id/factions to npcCharacterFactions, not npcCharacter',
  },
  {
    hash: '#/games/campaign/pcs/7/documents/5',
    expected: 'pcCharacterDocument',
    description:
      'resolves /games/:game_slug/pcs/:character_id/documents/:id to pcCharacterDocument, not pcCharacterDocuments',
  },
  {
    hash: '#/games/campaign/npcs/7/documents/5',
    expected: 'npcCharacterDocument',
    description:
      'resolves /games/:game_slug/npcs/:character_id/documents/:id to npcCharacterDocument, not npcCharacterDocuments',
  },
  {
    hash: '#/games/campaign/npcs/new',
    expected: 'gameNpcNew',
    description: 'resolves /games/:game_slug/npcs/new to gameNpcNew, not npcCharacter',
  },
  {
    hash: '#/games/campaign/npcs/7',
    expected: 'npcCharacter',
    description: 'still resolves /games/:game_slug/npcs/:character_id to npcCharacter',
  },
];

describe('HashRouteResolver', function() {
  runCases(CASES);
});
