import ApiTokensController from '../../../../../../../../../assets/js/components/resources/account/pages/controllers/ApiTokensController.js';

export const buildSetters = () => ({
  setTokens: jasmine.createSpy('setTokens'),
  setLoading: jasmine.createSpy('setLoading'),
  setError: jasmine.createSpy('setError'),
  setOptions: jasmine.createSpy('setOptions'),
  setOptionsError: jasmine.createSpy('setOptionsError'),
  setNotice: jasmine.createSpy('setNotice'),
});

export const buildController = (setters) => new ApiTokensController(setters);

export const response = (status, body = {}) => ({
  ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body),
});

export const OPTIONS = { scopes: ['npcs:read'], games: [], all_games: false };
export const TOKENS = [{ id: 1, name: 'CI' }];

export const stubEnsure = (RequestStore, { tokens = TOKENS, options = OPTIONS } = {}) => spyOn(RequestStore, 'ensure')
  .and.callFake(({ quantityType }) => {
    const data = quantityType === 'options' ? options : tokens;

    return data instanceof Error ? Promise.reject(data) : Promise.resolve({ data });
  });
