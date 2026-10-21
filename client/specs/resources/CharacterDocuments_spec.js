import { CharacterDocuments } from '../../src/resources/CharacterDocuments.js';
import { itBehavesLikeCharacterLinks } from '../support/characterLinkExamples.js';

describe('CharacterDocuments', () => {
  itBehavesLikeCharacterLinks({
    Klass: CharacterDocuments,
    factory: 'documents',
    remove: (links, options) => links.remove({ document_id: 7 }, options),
    removePath: (base) => [`${base}/remove`, `${base}/remove/all`],
    removeBody: { document_id: 7 },
  });
});
