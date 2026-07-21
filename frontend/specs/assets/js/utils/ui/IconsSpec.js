import Icons from '../../../../../assets/js/utils/ui/Icons.js';

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

  it('maps gem to the gem icon class', function() {
    expect(Icons.gem).toBe('bi-gem');
  });

  it('maps pencilFill to the filled pencil icon class', function() {
    expect(Icons.pencilFill).toBe('bi-pencil-fill');
  });

  it('maps envelope to the outline envelope icon class', function() {
    expect(Icons.envelope).toBe('bi-envelope');
  });

  it('maps envelopeFill to the filled envelope icon class', function() {
    expect(Icons.envelopeFill).toBe('bi-envelope-fill');
  });

  it('maps folder to the folder icon class', function() {
    expect(Icons.folder).toBe('bi-folder');
  });
});
