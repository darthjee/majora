import { PACKAGE_NAME, packageName } from '../src/index.js';

describe('index', () => {
  describe('PACKAGE_NAME', () => {
    it('is the npm package name', () => {
      expect(PACKAGE_NAME).toEqual('majora-client');
    });
  });

  describe('packageName', () => {
    it('returns the npm package name', () => {
      expect(packageName()).toEqual('majora-client');
    });
  });
});
