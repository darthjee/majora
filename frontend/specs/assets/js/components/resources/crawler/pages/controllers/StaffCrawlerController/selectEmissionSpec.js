import StaffCrawlerController
  from '../../../../../../../../../assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js';
import { buildClient, buildContext } from './support.js';

describe('StaffCrawlerController', function() {
  describe('#selectEmission', function() {
    it('calls setSelectedId with the given id', function() {
      const context = buildContext();
      const controller = new StaffCrawlerController(
        context.setLoading, context.setError, context.setEmissions, context.setSelectedId, buildClient(),
      );

      controller.selectEmission(42);

      expect(context.setSelectedId).toHaveBeenCalledWith(42);
    });
  });
});
