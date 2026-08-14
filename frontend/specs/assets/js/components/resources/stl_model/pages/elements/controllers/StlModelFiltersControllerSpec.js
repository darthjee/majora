import StlModelFiltersController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/elements/controllers/StlModelFiltersController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import { buildSource, buildCollection } from '../../../../../../../../support/factories.js';

function buildController(overrides = {}) {
  return new StlModelFiltersController(
    overrides.setName ?? jasmine.createSpy('setName'),
    overrides.setType ?? jasmine.createSpy('setType'),
    overrides.setSize ?? jasmine.createSpy('setSize'),
    overrides.setRaces ?? jasmine.createSpy('setRaces'),
    overrides.setRoles ?? jasmine.createSpy('setRoles'),
    overrides.setSources ?? jasmine.createSpy('setSources'),
    overrides.setCollections ?? jasmine.createSpy('setCollections'),
    overrides.setTags ?? jasmine.createSpy('setTags'),
  );
}

describe('StlModelFiltersController', function() {
  describe('#handleNameChange', function() {
    it('sets the draft name', function() {
      const setName = jasmine.createSpy('setName');
      buildController({ setName }).handleNameChange('gob');
      expect(setName).toHaveBeenCalledWith('gob');
    });
  });

  describe('#handleTypeChange', function() {
    it('sets the draft type', function() {
      const setType = jasmine.createSpy('setType');
      buildController({ setType }).handleTypeChange('creature');
      expect(setType).toHaveBeenCalledWith('creature');
    });
  });

  describe('#handleSizeChange', function() {
    it('sets the draft size', function() {
      const setSize = jasmine.createSpy('setSize');
      buildController({ setSize }).handleSizeChange('small');
      expect(setSize).toHaveBeenCalledWith('small');
    });
  });

  describe('#handleRacesChange', function() {
    it('sets the draft races', function() {
      const setRaces = jasmine.createSpy('setRaces');
      const picks = [{ id: 'elf', name: 'Elf' }];
      buildController({ setRaces }).handleRacesChange(picks);
      expect(setRaces).toHaveBeenCalledWith(picks);
    });
  });

  describe('#handleRolesChange', function() {
    it('sets the draft roles', function() {
      const setRoles = jasmine.createSpy('setRoles');
      const picks = [{ id: 'fighter', name: 'Fighter' }];
      buildController({ setRoles }).handleRolesChange(picks);
      expect(setRoles).toHaveBeenCalledWith(picks);
    });
  });

  describe('#handleSourcesChange', function() {
    it('sets the draft sources', function() {
      const setSources = jasmine.createSpy('setSources');
      const picks = [{ id: 1, name: 'MyMiniFactory' }];
      buildController({ setSources }).handleSourcesChange(picks);
      expect(setSources).toHaveBeenCalledWith(picks);
    });
  });

  describe('#handleCollectionsChange', function() {
    it('sets the draft collections', function() {
      const setCollections = jasmine.createSpy('setCollections');
      const picks = [{ id: 1, name: 'Goblin Pack' }];
      buildController({ setCollections }).handleCollectionsChange(picks);
      expect(setCollections).toHaveBeenCalledWith(picks);
    });
  });

  describe('#addTag', function() {
    it('splits/trims/de-duplicates the raw input and appends it to the draft tags', function() {
      const setTags = jasmine.createSpy('setTags');
      buildController({ setTags }).addTag(['painted'], 'resin, painted, metal');
      expect(setTags).toHaveBeenCalledWith(['painted', 'resin', 'metal']);
    });
  });

  describe('#removeTag', function() {
    it('removes the given tag from the draft tags', function() {
      const setTags = jasmine.createSpy('setTags');
      buildController({ setTags }).removeTag(['painted', 'resin'], 'painted');
      expect(setTags).toHaveBeenCalledWith(['resin']);
    });
  });

  describe('#buildQuery', function() {
    const controller = buildController();

    it('omits all fields when blank/empty', function() {
      expect(controller.buildQuery('', '', '', [], [], [], [], [])).toEqual({});
    });

    it('includes name when non-blank, trimmed', function() {
      expect(controller.buildQuery('  gob  ', '', '', [], [], [], [], [])).toEqual({ name: 'gob' });
    });

    it('includes type when non-blank', function() {
      expect(controller.buildQuery('', 'creature', '', [], [], [], [], [])).toEqual({ type: 'creature' });
    });

    it('includes size when non-blank', function() {
      expect(controller.buildQuery('', '', 'small', [], [], [], [], [])).toEqual({ size: 'small' });
    });

    it('extracts race ids from the picked races', function() {
      const races = [{ id: 'elf', name: 'Elf' }, { id: 'orc', name: 'Orc' }];
      expect(controller.buildQuery('', '', '', races, [], [], [], [])).toEqual({ race: ['elf', 'orc'] });
    });

    it('extracts role ids from the picked roles', function() {
      const roles = [{ id: 'fighter', name: 'Fighter' }];
      expect(controller.buildQuery('', '', '', [], roles, [], [], [])).toEqual({ roles: ['fighter'] });
    });

    it('extracts source ids from the picked sources', function() {
      const sources = [{ id: 1, name: 'MyMiniFactory' }, { id: 2, name: 'Other' }];
      expect(controller.buildQuery('', '', '', [], [], sources, [], [])).toEqual({ source: [1, 2] });
    });

    it('extracts collection ids from the picked collections', function() {
      const collections = [{ id: 3, name: 'Goblin Pack' }];
      expect(controller.buildQuery('', '', '', [], [], [], collections, [])).toEqual({ collection: [3] });
    });

    it('includes tags as-is', function() {
      expect(controller.buildQuery('', '', '', [], [], [], [], ['painted', 'resin']))
        .toEqual({ tags: ['painted', 'resin'] });
    });

    it('includes every field when set', function() {
      expect(controller.buildQuery(
        'gob', 'creature', 'small',
        [{ id: 'elf', name: 'Elf' }], [{ id: 'fighter', name: 'Fighter' }],
        [{ id: 1, name: 'MyMiniFactory' }], [{ id: 3, name: 'Goblin Pack' }],
        ['painted'],
      )).toEqual({
        name: 'gob', type: 'creature', size: 'small', race: ['elf'], roles: ['fighter'],
        source: [1], collection: [3], tags: ['painted'],
      });
    });
  });

  describe('#clear', function() {
    it('resets all draft fields to blank/empty', function() {
      const setName = jasmine.createSpy('setName');
      const setType = jasmine.createSpy('setType');
      const setSize = jasmine.createSpy('setSize');
      const setRaces = jasmine.createSpy('setRaces');
      const setRoles = jasmine.createSpy('setRoles');
      const setSources = jasmine.createSpy('setSources');
      const setCollections = jasmine.createSpy('setCollections');
      const setTags = jasmine.createSpy('setTags');

      buildController({
        setName, setType, setSize, setRaces, setRoles, setSources, setCollections, setTags,
      }).clear();

      expect(setName).toHaveBeenCalledWith('');
      expect(setType).toHaveBeenCalledWith('');
      expect(setSize).toHaveBeenCalledWith('');
      expect(setRaces).toHaveBeenCalledWith([]);
      expect(setRoles).toHaveBeenCalledWith([]);
      expect(setSources).toHaveBeenCalledWith([]);
      expect(setCollections).toHaveBeenCalledWith([]);
      expect(setTags).toHaveBeenCalledWith([]);
    });
  });

  describe('.resolveResourcePicks', function() {
    it('resolves each id to a {id, name} pick through RequestStore', async function() {
      spyOn(RequestStore, 'ensure').and.callFake(({ params }) => Promise.resolve({
        data: buildSource({ id: Number(params.id), name: `Source ${params.id}` }),
      }));

      const picks = await StlModelFiltersController.resolveResourcePicks('source', ['1', '2']);

      expect(RequestStore.ensure).toHaveBeenCalledWith({
        componentName: 'StlModelFiltersController', resource: 'source', quantityType: 'single', params: { id: '1' },
      });
      expect(picks).toEqual([{ id: 1, name: 'Source 1' }, { id: 2, name: 'Source 2' }]);
    });

    it('drops an id that fails to resolve', async function() {
      spyOn(RequestStore, 'ensure').and.callFake(({ params }) => {
        if (params.id === '2') {
          return Promise.reject(new Error('not found'));
        }

        return Promise.resolve({ data: buildCollection({ id: 1, name: 'Goblin Pack' }) });
      });

      const picks = await StlModelFiltersController.resolveResourcePicks('collection', ['1', '2']);

      expect(picks).toEqual([{ id: 1, name: 'Goblin Pack' }]);
    });

    it('resolves to an empty array for an empty id list', async function() {
      spyOn(RequestStore, 'ensure');

      const picks = await StlModelFiltersController.resolveResourcePicks('source', []);

      expect(picks).toEqual([]);
      expect(RequestStore.ensure).not.toHaveBeenCalled();
    });
  });

  describe('.loadResourcePicks', function() {
    it('does not call RequestStore.ensure and resolves immediately when ids is empty', async function() {
      const ensureSpy = spyOn(RequestStore, 'ensure');
      const setter = jasmine.createSpy('setter');

      await StlModelFiltersController.loadResourcePicks('source', [], setter);

      expect(ensureSpy).not.toHaveBeenCalled();
      expect(setter).not.toHaveBeenCalled();
    });

    it('resolves the picks and applies them via the given setter', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(
        Promise.resolve({ data: buildSource({ id: 1, name: 'MyMiniFactory' }) }),
      );
      const setter = jasmine.createSpy('setter');

      await StlModelFiltersController.loadResourcePicks('source', ['1'], setter);

      expect(setter).toHaveBeenCalledWith([{ id: 1, name: 'MyMiniFactory' }]);
    });
  });
});
