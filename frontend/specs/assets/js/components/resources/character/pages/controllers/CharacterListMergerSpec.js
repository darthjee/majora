import CharacterListMerger
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterListMerger.js';

describe('CharacterListMerger', function() {
  describe('.merge', function() {
    it('merges the resolved list onto the character under the given key on success', async function() {
      const listFetch = Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'Cloak of Elvenkind' }]),
      });

      const result = await CharacterListMerger.merge({ id: 2 }, 'items', listFetch);

      expect(result).toEqual({ id: 2, items: [{ id: 1, name: 'Cloak of Elvenkind' }] });
    });

    const degradedCases = [
      ['response is not ok', () => Promise.resolve({ ok: false })],
      ['request throws', () => Promise.reject(new Error('Network error'))],
      ['response body is not an array', () => Promise.resolve({
        ok: true, json: () => Promise.resolve({ unexpected: 'shape' }),
      })],
    ];

    degradedCases.forEach(([description, buildListFetch]) => {
      it(`degrades to an empty array when the ${description}`, async function() {
        const result = await CharacterListMerger.merge({ id: 2 }, 'items', buildListFetch());

        expect(result).toEqual({ id: 2, items: [] });
      });
    });
  });

  describe('.mergeResource', function() {
    it('merges the resolved data onto the character under the given key on success', async function() {
      const requestPromise = Promise.resolve({ data: [{ id: 1, name: 'Cloak of Elvenkind' }] });

      const result = await CharacterListMerger.mergeResource({ id: 2 }, 'items', requestPromise);

      expect(result).toEqual({ id: 2, items: [{ id: 1, name: 'Cloak of Elvenkind' }] });
    });

    const degradedCases = [
      ['the request rejects', () => Promise.reject(new Error('Network error'))],
      ['the resolved data is not an array', () => Promise.resolve({ data: { unexpected: 'shape' } })],
    ];

    degradedCases.forEach(([description, buildRequestPromise]) => {
      it(`degrades to an empty array when ${description}`, async function() {
        const result = await CharacterListMerger.mergeResource({ id: 2 }, 'items', buildRequestPromise());

        expect(result).toEqual({ id: 2, items: [] });
      });
    });
  });
});
