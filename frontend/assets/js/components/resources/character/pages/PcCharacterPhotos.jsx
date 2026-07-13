import CharacterPhotos from './shared/CharacterPhotos.jsx';
import PcCharacterPhotosController from './controllers/PcCharacterPhotosController.js';
import PcCharacterPhotosHelper from './helpers/PcCharacterPhotosHelper.jsx';

/**
 * PC character Photos index page.
 *
 * @returns {React.ReactElement} PC character photos page element.
 */
export default function PcCharacterPhotos() {
  return (
    <CharacterPhotos
      ControllerClass={PcCharacterPhotosController}
      getParamsFromHash={PcCharacterPhotosController.getPcCharacterPhotosParamsFromHash}
      PhotosHelper={PcCharacterPhotosHelper}
      characterKind="pcs"
    />
  );
}
