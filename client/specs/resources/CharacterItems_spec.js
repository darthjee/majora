import { CharacterItems } from '../../src/resources/CharacterItems.js';
import { itBehavesLikeCharacterLinks } from '../support/characterLinkExamples.js';

describe('CharacterItems', () => {
  itBehavesLikeCharacterLinks({
    Klass: CharacterItems,
    factory: 'items',
    remove: (links, options) => links.remove({ game_item_id: 3 }, options),
    removePath: (base) => [`${base}/remove`, `${base}/remove/all`],
    removeBody: { game_item_id: 3 },
  });
});
