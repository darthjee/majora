import StlModelEditController
  from '../../../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js';

describe('StlModelEditController', function() {
  it('extracts STL model id from an edit hash', function() {
    expect(StlModelEditController.getStlModelIdFromEditHash('#/miniatures/stl_models/42/edit')).toBe('42');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(StlModelEditController.getStlModelIdFromEditHash('#/miniatures/stl_models/42')).toBe('');
  });
});
