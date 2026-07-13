import CharacterPhotos from './shared/CharacterPhotos.jsx';
import NpcCharacterPhotosController from './controllers/NpcCharacterPhotosController.js';
import NpcCharacterPhotosHelper from './helpers/NpcCharacterPhotosHelper.jsx';

/**
 * NPC character Photos index page.
 *
 * @returns {React.ReactElement} NPC character photos page element.
 */
export default function NpcCharacterPhotos() {
  return (
    <CharacterPhotos
      ControllerClass={NpcCharacterPhotosController}
      getParamsFromHash={NpcCharacterPhotosController.getNpcCharacterPhotosParamsFromHash}
      PhotosHelper={NpcCharacterPhotosHelper}
      characterKind="npcs"
    />
  );
}
