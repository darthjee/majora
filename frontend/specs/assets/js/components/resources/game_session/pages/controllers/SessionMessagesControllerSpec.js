import SessionMessagesController
  from '../../../../../../../../assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js';
import AuthStorage from '../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('SessionMessagesController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  const buildResponse = (page, { ok = true, nextEntryId = null } = {}) => ({
    ok,
    headers: { get: () => nextEntryId },
    json: () => Promise.resolve(page),
  });

  describe('#loadFirstPage', function() {
    it('fetches the first page and replaces messages', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);
      const page = [{ id: 2, content: 'newer' }, { id: 1, content: 'older' }];

      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse(page, { nextEntryId: '1' })));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadFirstPage('demo', 7);

      expect(client.fetchMessages).toHaveBeenCalledWith('demo', 7, null);
      expect(setMessages).toHaveBeenCalledWith(page);
      expect(setNextEntryId).toHaveBeenCalledWith('1');
    });

    it('sends the token when the user is authenticated', async function() {
      AuthStorage.setToken('tok-abc');
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);

      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse([])));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadFirstPage('demo', 7);

      expect(client.fetchMessages).toHaveBeenCalledWith('demo', 7, 'tok-abc');
    });

    it('does not update state when the fetch fails', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);

      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse([], { ok: false })));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadFirstPage('demo', 7);

      expect(setMessages).not.toHaveBeenCalled();
      expect(setNextEntryId).not.toHaveBeenCalled();
    });

    it('swallows rejected fetches', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);

      client.fetchMessages.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadFirstPage('demo', 7);

      expect(setMessages).not.toHaveBeenCalled();
    });
  });

  describe('#loadMore', function() {
    it('fetches the next page with the cursor and appends deduped messages', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);
      const currentMessages = [{ id: 2, content: 'newer' }, { id: 1, content: 'older' }];
      const nextPage = [{ id: 1, content: 'older' }, { id: 0, content: 'oldest' }];

      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse(nextPage, { nextEntryId: null })));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadMore('demo', 7, currentMessages, 1);

      expect(client.fetchMessages).toHaveBeenCalledWith('demo', 7, null, 1);
      expect(setMessages).toHaveBeenCalledWith([
        { id: 2, content: 'newer' }, { id: 1, content: 'older' }, { id: 0, content: 'oldest' },
      ]);
      expect(setNextEntryId).toHaveBeenCalledWith(null);
    });

    it('toggles loadingMore around the fetch', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);

      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse([{ id: 1 }])));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadMore('demo', 7, [], 1);

      expect(setLoadingMore).toHaveBeenCalledWith(true);
      expect(setLoadingMore).toHaveBeenCalledWith(false);
    });

    it('resets loadingMore even when the fetch fails', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['fetchMessages']);

      client.fetchMessages.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      await controller.loadMore('demo', 7, [], 1);

      expect(setLoadingMore).toHaveBeenCalledWith(false);
      expect(setMessages).not.toHaveBeenCalled();
    });
  });

  describe('#postMessage', function() {
    const buildSetters = () => ({
      setContent: jasmine.createSpy('setContent'),
      setFieldErrors: jasmine.createSpy('setFieldErrors'),
      setPosting: jasmine.createSpy('setPosting'),
    });

    it('sets posting true and clears field errors before the request settles', function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['createMessage']);

      // eslint-disable-next-line no-empty-function
      client.createMessage.and.returnValue(new Promise(() => {}));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      const setters = buildSetters();

      controller.postMessage('demo', 7, null, 'hello', setters);

      expect(setters.setPosting).toHaveBeenCalledWith(true);
      expect(setters.setFieldErrors).toHaveBeenCalledWith({});
    });

    it('clears the content and reloads the first page on success', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['createMessage', 'fetchMessages']);
      const newMessage = { id: 3, content: 'hello' };

      client.createMessage.and.returnValue(Promise.resolve(buildResponse({}, { ok: true })));
      client.fetchMessages.and.returnValue(Promise.resolve(buildResponse([newMessage])));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      const setters = buildSetters();

      await controller.postMessage('demo', 7, null, 'hello', setters);

      expect(client.createMessage).toHaveBeenCalledWith('demo', 7, null, 'hello');
      expect(setters.setContent).toHaveBeenCalledWith('');
      expect(setMessages).toHaveBeenCalledWith([newMessage]);
      expect(setters.setPosting).toHaveBeenCalledWith(false);
    });

    it('surfaces field errors and does not clear content on a validation failure', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['createMessage']);

      client.createMessage.and.returnValue(Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ errors: { content: ['is required'] } }),
      }));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      const setters = buildSetters();

      await controller.postMessage('demo', 7, null, '', setters);

      expect(setters.setFieldErrors).toHaveBeenCalledWith({ content: ['is required'] });
      expect(setters.setContent).not.toHaveBeenCalledWith('');
      expect(setters.setPosting).toHaveBeenCalledWith(false);
    });

    it('resets posting even when the request rejects', async function() {
      const setMessages = jasmine.createSpy('setMessages');
      const setNextEntryId = jasmine.createSpy('setNextEntryId');
      const setLoadingMore = jasmine.createSpy('setLoadingMore');
      const client = jasmine.createSpyObj('client', ['createMessage']);

      client.createMessage.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new SessionMessagesController(setMessages, setNextEntryId, setLoadingMore, client);
      const setters = buildSetters();

      await expectAsync(controller.postMessage('demo', 7, null, 'hello', setters)).toBeRejected();

      expect(setters.setPosting).toHaveBeenCalledWith(false);
    });
  });
});
