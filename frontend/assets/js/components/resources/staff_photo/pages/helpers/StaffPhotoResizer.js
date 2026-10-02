import staffPhotoThumbnailSrc from './StaffPhotoThumbnailSrc.js';

const LOSSY_QUALITY = 0.85;

const FORMATS = {
  jpg: { mime: 'image/jpeg', quality: LOSSY_QUALITY },
  jpeg: { mime: 'image/jpeg', quality: LOSSY_QUALITY },
  webp: { mime: 'image/webp', quality: LOSSY_QUALITY },
  png: { mime: 'image/png' },
};

/**
 * Loads an image in the browser.
 *
 * @param {string} src - Image source URL.
 * @returns {Promise<HTMLImageElement>} Resolves with the loaded image, rejects on error.
 */
function browserLoadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`could not load ${src}`));
    image.src = src;
  });
}

/**
 * Creates a browser canvas of the given size.
 *
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @returns {HTMLCanvasElement} The canvas.
 */
function browserCreateCanvas(width, height) {
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

/**
 * Encodes a canvas into a blob.
 *
 * @param {HTMLCanvasElement} canvas - The drawn canvas.
 * @param {{mime: string, quality: (number|undefined)}} format - Output format.
 * @returns {Promise<Blob|null>} The encoded blob (`null` when encoding failed).
 */
function canvasToBlob(canvas, { mime, quality }) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

/**
 * Strips the query string / fragment from a path.
 *
 * @param {string} path - The photo path.
 * @returns {string} The bare path.
 */
function barePath(path) {
  return path.split(/[?#]/)[0];
}

/**
 * Extracts the lower-cased extension of a path.
 *
 * @param {string} path - The photo path.
 * @returns {string} The extension, without the dot (empty when none).
 */
function extensionOf(path) {
  const name = barePath(path).split('/').pop();
  const dot = name.lastIndexOf('.');

  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

const DEFAULTS = { loadImage: browserLoadImage, createCanvas: browserCreateCanvas, versions: {} };

/**
 * Client-side resize of staff photos (issue #1474).
 *
 * @description Decides whether a photo row needs resizing and produces the resized `File`,
 *   fitting the image inside a `max` × `max` box, keeping the original format and never
 *   upscaling. Browser primitives (image loading, canvas creation) are injectable so the logic
 *   runs without a DOM. Reasons are bare `staff_photos_page` key suffixes.
 */
export default class StaffPhotoResizer {
  /**
   * Returns why a photo row cannot be resized, from the row alone.
   *
   * @param {{path: string, ready: boolean, replace_in_progress: boolean}} photo - The photo row.
   * @returns {string|null} The skip reason key suffix, or `null` when it may be resized.
   */
  static skipReason(photo) {
    if (photo.replace_in_progress) return 'skip_replace_in_progress';
    if (!photo.path) return 'skip_no_path';
    if (!photo.ready) return 'skip_not_ready';
    if (extensionOf(photo.path) === 'gif') return 'skip_gif';

    return null;
  }

  /**
   * Maps a photo path extension to its output format.
   *
   * @param {string} path - The photo path.
   * @returns {{mime: string, quality: (number|undefined)}|null} Output format, or `null` when
   *   the extension is not supported.
   */
  static outputFormat(path) {
    return FORMATS[extensionOf(path)] ?? null;
  }

  /**
   * Computes the dimensions fitting a `max` × `max` box, keeping the aspect ratio.
   *
   * @param {number} width - Natural width.
   * @param {number} height - Natural height.
   * @param {number} max - Max dimension of the longest side.
   * @returns {{width: number, height: number}|null} The scaled dimensions, or `null` when the
   *   image already fits (never upscale).
   */
  static fitDimensions(width, height, max) {
    const longest = Math.max(width, height);

    if (longest <= max) return null;

    const ratio = max / longest;

    return {
      width: Math.max(1, Math.round(width * ratio)),
      height: Math.max(1, Math.round(height * ratio)),
    };
  }

  /**
   * Resizes a photo row.
   *
   * @param {{id: number, path: string, ready: boolean, replace_in_progress: boolean}} photo -
   *   The photo row.
   * @param {number} maxDimension - Max dimension of the longest side.
   * @param {object} [deps] - Injectable dependencies.
   * @param {Function} [deps.loadImage] - `(src) => Promise<image>` loader.
   * @param {Function} [deps.createCanvas] - `(width, height) => canvas` factory.
   * @param {object} [deps.versions] - Map of photo id to cache-busting version.
   * @returns {Promise<{status: string, reason: (string|undefined), file: (File|undefined)}>}
   *   `skipped` (with a reason), `resized` (with the file) or `failed` (with a reason).
   */
  static async resize(photo, maxDimension, deps = {}) {
    const { loadImage, createCanvas, versions } = { ...DEFAULTS, ...deps };
    const reason = StaffPhotoResizer.skipReason(photo);

    if (reason) return { status: 'skipped', reason };

    const format = StaffPhotoResizer.outputFormat(photo.path);

    if (!format) return { status: 'failed', reason: 'error_resize_encode_failed' };

    let image;

    try {
      image = await loadImage(staffPhotoThumbnailSrc(photo, versions));
    } catch {
      return { status: 'failed', reason: 'error_resize_load_failed' };
    }

    const size = StaffPhotoResizer.fitDimensions(image.naturalWidth, image.naturalHeight, maxDimension);

    if (!size) return { status: 'skipped', reason: 'skip_already_small' };

    return StaffPhotoResizer.#encode(photo, image, size, format, createCanvas);
  }

  static async #encode(photo, image, { width, height }, format, createCanvas) {
    try {
      const canvas = createCanvas(width, height);

      canvas.getContext('2d').drawImage(image, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, format);

      if (!blob) return { status: 'failed', reason: 'error_resize_encode_failed' };

      const name = barePath(photo.path).split('/').pop();

      return { status: 'resized', file: new File([blob], name, { type: format.mime }) };
    } catch {
      return { status: 'failed', reason: 'error_resize_encode_failed' };
    }
  }
}
