import { MajoraClient } from '../../src/MajoraClient.js';
import { CommandRegistry } from '../../src/cli/CommandRegistry.js';
import { Documents } from '../../src/resources/Documents.js';
import { Factions } from '../../src/resources/Factions.js';
import { Games } from '../../src/resources/Games.js';
import { Items } from '../../src/resources/Items.js';
import { Npcs } from '../../src/resources/Npcs.js';
import { Pcs } from '../../src/resources/Pcs.js';
import { FetchStub } from '../support/FetchStub.js';

describe('CommandRegistry', () => {
  describe('.resourceNames', () => {
    it('lists the plain resources', () => {
      expect(CommandRegistry.resourceNames()).toEqual(['games', 'npcs', 'pcs', 'factions', 'items', 'documents']);
    });
  });

  describe('.resource', () => {
    it('returns the games definition', () => {
      expect(CommandRegistry.resource('games')).toEqual(jasmine.objectContaining({
        actions: ['list', 'mine', 'get'], gameScoped: false,
      }));
    });

    it('returns the pcs definition without create', () => {
      expect(CommandRegistry.resource('pcs')).toEqual(jasmine.objectContaining({
        actions: ['list', 'get', 'update'], gameScoped: true,
      }));
    });

    ['npcs', 'factions', 'items', 'documents'].forEach((name) => {
      it(`returns the ${name} definition`, () => {
        expect(CommandRegistry.resource(name)).toEqual(jasmine.objectContaining({
          actions: ['list', 'get', 'create', 'update'], gameScoped: true,
        }));
      });
    });

    it('returns null for an unknown resource', () => {
      expect(CommandRegistry.resource('links')).toBeNull();
    });

    it('returns null for an inherited property', () => {
      expect(CommandRegistry.resource('toString')).toBeNull();
    });

    it('returns a copy of the actions', () => {
      CommandRegistry.resource('npcs').actions.push('delete');

      expect(CommandRegistry.hasAction('npcs', 'delete')).toBeFalse();
    });
  });

  describe('.hasAction', () => {
    it('accepts an allowed action', () => {
      expect(CommandRegistry.hasAction('games', 'mine')).toBeTrue();
    });

    it('rejects an action the resource lacks', () => {
      expect(CommandRegistry.hasAction('pcs', 'create')).toBeFalse();
    });

    it('rejects mine on a game-scoped resource', () => {
      expect(CommandRegistry.hasAction('npcs', 'mine')).toBeFalse();
    });

    it('rejects an unknown resource', () => {
      expect(CommandRegistry.hasAction('links', 'list')).toBeFalse();
    });
  });

  describe('.isGameScoped', () => {
    it('is false for games', () => {
      expect(CommandRegistry.isGameScoped('games')).toBeFalse();
    });

    it('is true for npcs', () => {
      expect(CommandRegistry.isGameScoped('npcs')).toBeTrue();
    });

    it('is false for an unknown resource', () => {
      expect(CommandRegistry.isGameScoped('links')).toBeFalse();
    });
  });

  describe('.needsId and .takesBody', () => {
    it('needs an id for get and update only', () => {
      expect(['list', 'mine', 'get', 'create', 'update'].filter((a) => CommandRegistry.needsId(a)))
        .toEqual(['get', 'update']);
    });

    it('takes a body for create and update only', () => {
      expect(['list', 'mine', 'get', 'create', 'update'].filter((a) => CommandRegistry.takesBody(a)))
        .toEqual(['create', 'update']);
    });
  });

  describe('.wrapper', () => {
    let client;

    beforeEach(() => {
      const stub = new FetchStub();

      client = new MajoraClient({
        baseUrl: 'https://majora.example.com', token: 'mjr_fake', fetch: stub.fetch, env: {},
      });
    });

    it('returns client.games for games', () => {
      expect(CommandRegistry.wrapper('games', client)).toBe(client.games);
      expect(CommandRegistry.wrapper('games', client)).toEqual(jasmine.any(Games));
    });

    [['npcs', Npcs], ['pcs', Pcs], ['factions', Factions], ['items', Items], ['documents', Documents]]
      .forEach(([name, klass]) => {
        it(`returns the ${name} wrapper bound to the game`, () => {
          const wrapper = CommandRegistry.wrapper(name, client, 'epic-quest');

          expect(wrapper).toEqual(jasmine.any(klass));
          expect(wrapper.slug).toEqual('epic-quest');
        });
      });

    it('throws for an unknown resource', () => {
      expect(() => CommandRegistry.wrapper('links', client)).toThrowError(/Unknown resource/);
    });
  });
});
