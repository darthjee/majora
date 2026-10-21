import { UsageError } from '../../src/core/errors/UsageError.js';
import { CharacterFactions } from '../../src/resources/CharacterFactions.js';
import { BASE_URL } from '../support/buildCore.js';
import { itBehavesLikeCharacterLinks } from '../support/characterLinkExamples.js';

describe('CharacterFactions', () => {
  itBehavesLikeCharacterLinks({
    Klass: CharacterFactions,
    factory: 'factions',
    remove: (links, options) => links.remove(5, { reason: 'left' }, options),
    removePath: (base) => [`${base}/5/remove`, `${base}/5/remove/all`],
    removeBody: { reason: 'left' },
    extra: ({ base, getLinks, getStub }) => {
      describe('remove(factionId)', () => {
        it('sends an empty JSON object when no body is given', async () => {
          getStub().reply(200, { status: 'ok' });
          await getLinks().remove(5);

          expect(getStub().lastCall.url).toEqual(`${BASE_URL}/${base}/5/remove.json`);
          expect(JSON.parse(getStub().lastCall.options.body)).toEqual({});
        });

        it('URL-encodes the faction id', async () => {
          getStub().reply(200, { status: 'ok' });
          await getLinks().remove('a b');

          expect(getStub().lastCall.url).toEqual(`${BASE_URL}/${base}/a%20b/remove.json`);
        });

        [undefined, null, ''].forEach((blank) => {
          it(`rejects a blank faction id (${JSON.stringify(blank)}) with UsageError, without any request`, async () => {
            await expectAsync(getLinks().remove(blank)).toBeRejectedWithError(UsageError);
            expect(getStub().calls).toEqual([]);
          });
        });
      });
    },
  });
});
