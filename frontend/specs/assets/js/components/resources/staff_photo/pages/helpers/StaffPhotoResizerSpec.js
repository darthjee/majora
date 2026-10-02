import StaffPhotoResizer from '../../../../../../../../assets/js/components/resources/staff_photo/pages/helpers/StaffPhotoResizer.js';

describe('StaffPhotoResizer', function() {
  const basePhoto = {
    id: 3, path: '/photos/game/3.jpg', ready: true, replace_in_progress: false,
  };

  describe('.skipReason', function() {
    it('returns skip_replace_in_progress first', function() {
      expect(StaffPhotoResizer.skipReason({ ...basePhoto, replace_in_progress: true, path: '' }))
        .toBe('skip_replace_in_progress');
    });

    it('returns skip_no_path when the path is empty', function() {
      expect(StaffPhotoResizer.skipReason({ ...basePhoto, path: '', ready: false })).toBe('skip_no_path');
    });

    it('returns skip_not_ready when the photo is not ready', function() {
      expect(StaffPhotoResizer.skipReason({ ...basePhoto, ready: false, path: '/a.gif' }))
        .toBe('skip_not_ready');
    });

    it('returns skip_gif for a gif, case-insensitive and ignoring the query', function() {
      expect(StaffPhotoResizer.skipReason({ ...basePhoto, path: '/photos/a.GIF?x=1' })).toBe('skip_gif');
    });

    it('returns null when the photo may be resized', function() {
      expect(StaffPhotoResizer.skipReason(basePhoto)).toBeNull();
    });
  });

  describe('.outputFormat', function() {
    it('maps jpg and jpeg to image/jpeg', function() {
      expect(StaffPhotoResizer.outputFormat('/a.jpg')).toEqual({ mime: 'image/jpeg', quality: 0.85 });
      expect(StaffPhotoResizer.outputFormat('/a.JPEG')).toEqual({ mime: 'image/jpeg', quality: 0.85 });
    });

    it('maps webp to image/webp', function() {
      expect(StaffPhotoResizer.outputFormat('/a.webp')).toEqual({ mime: 'image/webp', quality: 0.85 });
    });

    it('maps png to image/png without quality', function() {
      expect(StaffPhotoResizer.outputFormat('/a.png?v=1')).toEqual({ mime: 'image/png' });
    });

    it('returns null for other extensions', function() {
      expect(StaffPhotoResizer.outputFormat('/a.bmp')).toBeNull();
      expect(StaffPhotoResizer.outputFormat('/noext')).toBeNull();
    });
  });

  describe('.fitDimensions', function() {
    it('scales a landscape image', function() {
      expect(StaffPhotoResizer.fitDimensions(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 });
    });

    it('scales a portrait image', function() {
      expect(StaffPhotoResizer.fitDimensions(1500, 3001, 1000)).toEqual({ width: 500, height: 1000 });
    });

    it('scales a square image', function() {
      expect(StaffPhotoResizer.fitDimensions(2000, 2000, 1000)).toEqual({ width: 1000, height: 1000 });
    });

    it('returns null at the exact limit', function() {
      expect(StaffPhotoResizer.fitDimensions(1000, 800, 1000)).toBeNull();
    });

    it('returns null for a smaller image', function() {
      expect(StaffPhotoResizer.fitDimensions(300, 200, 1000)).toBeNull();
    });
  });

  describe('.resize', function() {
    let image;
    let context;
    let canvas;
    let blob;
    let loadImage;
    let createCanvas;

    beforeEach(function() {
      image = { naturalWidth: 4000, naturalHeight: 2000 };
      context = jasmine.createSpyObj('context', ['drawImage']);
      blob = new Blob(['data'], { type: 'image/jpeg' });
      canvas = {
        getContext: jasmine.createSpy('getContext').and.returnValue(context),
        toBlob: jasmine.createSpy('toBlob').and.callFake((callback) => callback(blob)),
      };
      loadImage = jasmine.createSpy('loadImage').and.returnValue(Promise.resolve(image));
      createCanvas = jasmine.createSpy('createCanvas').and.returnValue(canvas);
    });

    it('skips from the row without loading the image', async function() {
      const result = await StaffPhotoResizer.resize({ ...basePhoto, ready: false }, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'skipped', reason: 'skip_not_ready' });
      expect(loadImage).not.toHaveBeenCalled();
    });

    it('fails with encode_failed for an unsupported extension', async function() {
      const result = await StaffPhotoResizer.resize({ ...basePhoto, path: '/a.bmp' }, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'failed', reason: 'error_resize_encode_failed' });
      expect(loadImage).not.toHaveBeenCalled();
    });

    it('fails with load_failed when the image does not load', async function() {
      loadImage.and.returnValue(Promise.reject(new Error('nope')));

      const result = await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'failed', reason: 'error_resize_load_failed' });
    });

    it('skips when the image already fits', async function() {
      image.naturalWidth = 800;
      image.naturalHeight = 600;

      const result = await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'skipped', reason: 'skip_already_small' });
      expect(createCanvas).not.toHaveBeenCalled();
    });

    it('loads the image with the recorded cache-busting version', async function() {
      await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas, versions: { 3: 77 } });

      expect(loadImage).toHaveBeenCalledWith('/photos/game/3.jpg?v=77');
    });

    it('fails with encode_failed when toBlob yields null', async function() {
      canvas.toBlob.and.callFake((callback) => callback(null));

      const result = await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'failed', reason: 'error_resize_encode_failed' });
    });

    it('fails with encode_failed when toBlob throws', async function() {
      canvas.toBlob.and.throwError('boom');

      const result = await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas });

      expect(result).toEqual({ status: 'failed', reason: 'error_resize_encode_failed' });
    });

    it('draws the scaled image and returns the resized file', async function() {
      const result = await StaffPhotoResizer.resize(basePhoto, 1000, { loadImage, createCanvas });

      expect(createCanvas).toHaveBeenCalledWith(1000, 500);
      expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0, 1000, 500);
      expect(canvas.toBlob).toHaveBeenCalledWith(jasmine.any(Function), 'image/jpeg', 0.85);
      expect(result.status).toBe('resized');
      expect(result.file.name).toBe('3.jpg');
      expect(result.file.type).toBe('image/jpeg');
    });

    it('keeps the png format without quality', async function() {
      const result = await StaffPhotoResizer.resize(
        { ...basePhoto, path: '/photos/game/3.png?v=1' }, 1000, { loadImage, createCanvas },
      );

      expect(canvas.toBlob).toHaveBeenCalledWith(jasmine.any(Function), 'image/png', undefined);
      expect(result.file.name).toBe('3.png');
      expect(result.file.type).toBe('image/png');
    });
  });
});
