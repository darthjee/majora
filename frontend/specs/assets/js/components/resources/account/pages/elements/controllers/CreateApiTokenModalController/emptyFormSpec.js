import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModalController.emptyForm', function() {
  it('starts empty with the 90-day expiry', function() {
    expect(CreateApiTokenModalController.emptyForm()).toEqual({
      name: '', scopes: [], games: [], expiry: { choice: '90', customDate: '' },
    });
  });
});
