import StlModelNewHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelNewHelper.jsx';

describe('StlModelNewHelper.buildFieldHandlers', function() {
  let setField, handleChange, handleCheckboxChange, setSources, setCollections, handlers;

  beforeEach(function() {
    setField = jasmine.createSpy('setField');
    handleChange = jasmine.createSpy('handleChange').and.callFake((name) => `change:${name}`);
    handleCheckboxChange = jasmine.createSpy('handleCheckboxChange')
      .and.callFake((name) => `checkbox:${name}`);
    setSources = jasmine.createSpy('setSources');
    setCollections = jasmine.createSpy('setCollections');

    handlers = StlModelNewHelper.buildFieldHandlers({
      setField, handleChange, handleCheckboxChange, setSources, setCollections,
    });
  });

  it('builds the text and select change handlers', function() {
    expect(handlers.onNameChange).toBe('change:name');
    expect(handlers.onTypeChange).toBe('change:type');
    expect(handlers.onUrlChange).toBe('change:url');
    expect(handlers.onSizeChange).toBe('change:size');
  });

  it('builds the owned checkbox change handler', function() {
    expect(handlers.onOwnedChange).toBe('checkbox:owned');
  });

  it('sets the races field', function() {
    handlers.onRacesChange(['elf']);

    expect(setField).toHaveBeenCalledWith('races', ['elf']);
  });

  it('sets the roles field', function() {
    handlers.onRolesChange(['tank']);

    expect(setField).toHaveBeenCalledWith('roles', ['tank']);
  });

  it('passes the sources and collections setters through', function() {
    expect(handlers.onSourcesChange).toBe(setSources);
    expect(handlers.onCollectionsChange).toBe(setCollections);
  });
});
