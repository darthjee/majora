import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StlModelEdit, { buildEnumPicks }
  from '../../../../../../../assets/js/components/resources/stl_model/pages/StlModelEdit.jsx';
import StlModelEditController
  from '../../../../../../../assets/js/components/resources/stl_model/pages/controllers/StlModelEditController.js';
import StlModelEditHelper
  from '../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelEditHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('buildEnumPicks', function() {
  it('shapes each raw value as {id, name} translated via the given prefix', function() {
    expect(buildEnumPicks(['elf', 'orc'], 'race')).toEqual([
      { id: 'elf', name: 'Elf' }, { id: 'orc', name: 'Orc' },
    ]);
  });

  it('returns an empty array for an empty/null/undefined input', function() {
    expect(buildEnumPicks([], 'race')).toEqual([]);
    expect(buildEnumPicks(null, 'race')).toEqual([]);
    expect(buildEnumPicks(undefined, 'race')).toEqual([]);
  });
});

describe('StlModelEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/miniatures/stl_models/42/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(StlModelEditController);
    stubRenderLoading(StlModelEditHelper);

    const html = renderToStaticMarkup(React.createElement(StlModelEdit));

    expect(html).toContain('loading');
  });
});
