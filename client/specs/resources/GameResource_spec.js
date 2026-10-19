import { UsageError } from '../../src/core/errors/UsageError.js';
import { CharacterResource } from '../../src/resources/CharacterResource.js';
import { GameResource } from '../../src/resources/GameResource.js';
import { Resource } from '../../src/resources/Resource.js';
import { FetchStub } from '../support/FetchStub.js';
import { BASE_URL, buildCore } from '../support/buildCore.js';

class Gadgets extends GameResource {
  static family = 'gadgets';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: null },
  };
}

class Heroes extends CharacterResource {
  static family = 'heroes';
}

describe('GameResource', () => {
  let stub;
  let core;

  beforeEach(() => {
    stub = new FetchStub();
    core = buildCore(stub);
  });

  it('is a Resource based on games/<slug>/<family>', () => {
    const gadgets = new Gadgets(core.http, core.paginator, 'epic-quest');

    expect(gadgets).toEqual(jasmine.any(Resource));
    expect(gadgets.slug).toEqual('epic-quest');
    expect(gadgets.basePath).toEqual('games/epic-quest/gadgets');
    expect(gadgets.pathFor('list', { restricted: true })).toEqual('games/epic-quest/gadgets/all');
  });

  it('URL-encodes the slug', () => {
    const gadgets = new Gadgets(core.http, core.paginator, 'a b/c');

    expect(gadgets.basePath).toEqual('games/a%20b%2Fc/gadgets');
  });

  it('raises UsageError for a blank slug', () => {
    [undefined, null, ''].forEach((slug) => {
      expect(() => new Gadgets(core.http, core.paginator, slug)).toThrowError(UsageError, 'Missing game slug');
    });
  });

  it('requests the game-scoped URL', async () => {
    stub.reply(200, { id: 4 });
    await new Gadgets(core.http, core.paginator, 'epic-quest').get(4);

    expect(stub.lastCall.url).toEqual(`${BASE_URL}/games/epic-quest/gadgets/4.json`);
  });
});

describe('CharacterResource', () => {
  let stub;
  let core;
  let heroes;

  beforeEach(() => {
    stub = new FetchStub();
    core = buildCore(stub);
    heroes = new Heroes(core.http, core.paginator, 'epic-quest');
  });

  it('is a GameResource', () => {
    expect(heroes).toEqual(jasmine.any(GameResource));
  });

  it('shares the get and update variants', () => {
    expect(heroes.pathFor('get', { id: 1 })).toEqual('games/epic-quest/heroes/1');
    expect(heroes.pathFor('get', { id: 1, restricted: true })).toEqual('games/epic-quest/heroes/1/full');
    expect(heroes.pathFor('update', { id: 1 })).toEqual('games/epic-quest/heroes/1');
    expect(heroes.pathFor('update', { id: 1, restricted: true })).toEqual('games/epic-quest/heroes/1/full');
  });

  it('declares no list nor create by itself', async () => {
    expect(() => heroes.pathFor('list')).toThrowError(UsageError);
    await expectAsync(heroes.create({})).toBeRejectedWithError(UsageError);
    expect(stub.calls).toEqual([]);
  });
});
