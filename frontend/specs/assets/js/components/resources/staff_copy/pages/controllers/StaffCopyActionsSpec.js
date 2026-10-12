import StaffCopyActions from '../../../../../../../../assets/js/components/resources/staff_copy/pages/controllers/StaffCopyActions.js';
import RequestStore from '../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffCopyActions', function() {
  let uploadClient;
  let actions;

  beforeEach(function() {
    uploadClient = jasmine.createSpyObj('uploadClient', ['linkUpload']);
    actions = new StaffCopyActions({ uploadClient });
  });

  describe('#copy', function() {
    let mutateSpy;

    beforeEach(function() {
      mutateSpy = spyOn(RequestStore, 'mutate');
    });

    it('posts the target and returns the parsed body on success', async function() {
      const body = { id: 7, links: [] };
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(body) }));

      expect(await actions.copy('items', 3, 'target-game')).toEqual({ ok: true, status: 201, data: body });
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'staffCopy',
        method: 'POST',
        quantityType: 'copy',
        params: { copyType: 'items', id: 3 },
        body: { target: 'target-game' },
      }));
    });

    it('returns the failed status without data', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 422 }));

      expect(await actions.copy('items', 3, 't')).toEqual({ ok: false, status: 422, data: null });
    });

    it('maps network errors to an undefined status', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('offline')));

      expect(await actions.copy('items', 3, 't')).toEqual({ ok: false, status: undefined, data: null });
    });
  });

  describe('#renew', function() {
    let mutateSpy;

    beforeEach(function() {
      mutateSpy = spyOn(RequestStore, 'mutate');
    });

    it('renews the token and returns the parsed body', async function() {
      const body = { upload_id: 5, upload_type: 'image', token: 'new' };
      mutateSpy.and.returnValue(Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) }));

      expect(await actions.renew(5)).toEqual({ ok: true, status: 200, data: body });
      expect(mutateSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        method: 'POST', quantityType: 'renew', params: { uploadId: 5 },
      }));
    });

    it('returns the failed status without data', async function() {
      mutateSpy.and.returnValue(Promise.resolve({ ok: false, status: 409 }));

      expect(await actions.renew(5)).toEqual({ ok: false, status: 409, data: null });
    });

    it('maps network errors to an undefined status', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('offline')));

      expect(await actions.renew(5)).toEqual({ ok: false, status: undefined, data: null });
    });
  });

  describe('#link', function() {
    const link = { upload_id: 5, upload_type: 'image', token: 'tok' };

    it('links through the upload client', async function() {
      uploadClient.linkUpload.and.returnValue(Promise.resolve({ ok: true, status: 200 }));

      expect(await actions.link(link)).toEqual({ ok: true, status: 200 });
      expect(uploadClient.linkUpload).toHaveBeenCalledWith('image', 5, 'tok');
    });

    it('returns the failed status', async function() {
      uploadClient.linkUpload.and.returnValue(Promise.resolve({ ok: false, status: 404 }));

      expect(await actions.link(link)).toEqual({ ok: false, status: 404 });
    });

    it('maps network errors to an undefined status', async function() {
      uploadClient.linkUpload.and.returnValue(Promise.reject(new Error('offline')));

      expect(await actions.link(link)).toEqual({ ok: false, status: undefined });
    });
  });

  it('builds a default upload client', function() {
    expect(new StaffCopyActions().uploadClient).toBeDefined();
  });
});
