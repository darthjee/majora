import { runCases } from './support.js';

const CASES = [
  { hash: '#/games', expected: 'games' },
  { hash: '#/games/campaign/pcs', expected: 'gamePcs' },
  { hash: '#/games/campaign/npcs', expected: 'gameNpcs' },
  { hash: '#/recover-password?token=abc', expected: 'recoverPassword' },
  { hash: '#/users/register', expected: 'register' },
  { hash: '#/account/authorization_requests', expected: 'accountAuthorizationRequests' },
  { hash: '#/my_account', expected: 'myAccount' },
  { hash: '#/my-games', expected: 'myGames' },
  { hash: '#/games/new', expected: 'gameNew', description: 'resolves /games/new to gameNew, not game' },
  {
    hash: '#/games/campaign/edit',
    expected: 'gameEdit',
    description: 'resolves /games/:game_slug/edit to gameEdit, not game',
  },
  { hash: '#/games/campaign', expected: 'game', description: 'still resolves /games/:game_slug to game' },
  {
    hash: '#/games/campaign/items',
    expected: 'gameItems',
    description: 'resolves /games/:game_slug/items to gameItems, not game',
  },
  {
    hash: '#/games/campaign/items/5',
    expected: 'gameItem',
    description: 'resolves /games/:game_slug/items/:id to gameItem, not gameItems',
  },
  {
    hash: '#/games/campaign/items/new',
    expected: 'gameItemNew',
    description: 'resolves /games/:game_slug/items/new to gameItemNew, not gameItem',
  },
  {
    hash: '#/games/campaign/items/5/edit',
    expected: 'gameItemEdit',
    description: 'resolves /games/:game_slug/items/:id/edit to gameItemEdit, not gameItem',
  },
  {
    hash: '#/games/campaign/documents',
    expected: 'gameDocuments',
    description: 'resolves /games/:game_slug/documents to gameDocuments, not game',
  },
  {
    hash: '#/games/campaign/documents/5',
    expected: 'gameDocument',
    description: 'resolves /games/:game_slug/documents/:id to gameDocument, not gameDocuments',
  },
  {
    hash: '#/games/campaign/documents/new',
    expected: 'gameDocumentNew',
    description: 'resolves /games/:game_slug/documents/new to gameDocumentNew, not gameDocument',
  },
  {
    hash: '#/games/campaign/documents/5/edit',
    expected: 'gameDocumentEdit',
    description: 'resolves /games/:game_slug/documents/:id/edit to gameDocumentEdit, not gameDocument',
  },
  {
    hash: '#/games/campaign/photos',
    expected: 'gamePhotos',
    description: 'resolves /games/:game_slug/photos to gamePhotos, not game',
  },
  {
    hash: '#/games/campaign/players/7',
    expected: 'gamePlayer',
    description: 'resolves /games/:game_slug/players/:id to gamePlayer, not gamePlayers',
  },
  {
    hash: '#/games/campaign/players',
    expected: 'gamePlayers',
    description: 'still resolves /games/:game_slug/players to gamePlayers',
  },
  {
    hash: '#/games/campaign/treasures/new',
    expected: 'gameTreasureNew',
    description: 'resolves /games/:game_slug/treasures/new to gameTreasureNew, not gameTreasures',
  },
  {
    hash: '#/games/campaign/treasures/7/edit',
    expected: 'gameTreasureEdit',
    description: 'resolves /games/:game_slug/treasures/:treasure_id/edit to gameTreasureEdit',
  },
  {
    hash: '#/games/campaign/treasures',
    expected: 'gameTreasures',
    description: 'still resolves /games/:game_slug/treasures to gameTreasures',
  },
  {
    hash: '#/games/campaign/polls/new',
    expected: 'gamePollNew',
    description: 'resolves /games/:game_slug/polls/new to gamePollNew, not gamePoll',
  },
  {
    hash: '#/games/campaign/polls/7',
    expected: 'gamePoll',
    description: 'resolves /games/:game_slug/polls/:id to gamePoll, not gamePolls',
  },
  {
    hash: '#/games/campaign/polls',
    expected: 'gamePolls',
    description: 'still resolves /games/:game_slug/polls to gamePolls',
  },
];

describe('HashRouteResolver', function() {
  runCases(CASES);
});
