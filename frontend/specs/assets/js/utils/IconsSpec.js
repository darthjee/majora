import Icons from '../../../../assets/js/utils/Icons.js';

describe('Icons', function() {
  it('maps camera to the filled camera icon class', function() {
    expect(Icons.camera).toBe('bi-camera-fill');
  });

  it('maps heart to the filled heart icon class', function() {
    expect(Icons.heart).toBe('bi-heart-fill');
  });

  it('maps heartOutline to the outline heart icon class', function() {
    expect(Icons.heartOutline).toBe('bi-heart');
  });

  it('maps skull to the outline skull icon class', function() {
    expect(Icons.skull).toBe('bi-skull');
  });

  it('maps skullFill to the filled skull icon class', function() {
    expect(Icons.skullFill).toBe('bi-skull-fill');
  });

  it('maps trash to the filled trash icon class', function() {
    expect(Icons.trash).toBe('bi-trash-fill');
  });

  it('maps restore to the filled plus-circle icon class', function() {
    expect(Icons.restore).toBe('bi-plus-circle-fill');
  });

  it('maps viewAs to the filled file-person icon class', function() {
    expect(Icons.viewAs).toBe('bi-file-person-fill');
  });
});
