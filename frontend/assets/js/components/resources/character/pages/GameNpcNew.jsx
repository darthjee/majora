import { useEffect, useMemo, useState } from 'react';
import GameNpcNewController from './controllers/GameNpcNewController.js';
import Noop from '../../../../utils/Noop.js';
import GameNpcNewHelper from './helpers/GameNpcNewHelper.jsx';
import LinksEditModal from './elements/LinksEditModal.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Game NPC creation page.
 *
 * @returns {React.ReactElement} Game NPC creation page element.
 */
export default function GameNpcNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [links, setLinks] = useState([]);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const { state: fields, handleChange, handleCheckboxChange } = useFormState({
    name: '',
    role: '',
    description: '',
    privateDescription: '',
    hidden: false,
    money: '0',
    allegiance: 'neutral',
    publicAllegiance: 'neutral',
  });

  const controller = useMemo(
    () => new GameNpcNewController(Noop.noop, setFieldErrors),
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameNpcNewController.getGameSlugFromNpcNewHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { ...fields, links },
    { setStatus, setFieldErrors },
  );

  return (
    <>
      {GameNpcNewHelper.render(
        {
          ...fields, links, status, fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onRoleChange: handleChange('role'),
          onDescriptionChange: handleChange('description'),
          onPrivateDescriptionChange: handleChange('privateDescription'),
          onOpenLinksModal: () => setShowLinksModal(true),
          onHiddenChange: handleCheckboxChange('hidden'),
          onMoneyChange: handleChange('money'),
          onAllegianceChange: handleChange('allegiance'),
          onPublicAllegianceChange: handleChange('publicAllegiance'),
        },
      )}
      <LinksEditModal
        show={showLinksModal}
        links={links}
        onClose={() => setShowLinksModal(false)}
        onConfirm={(newLinks) => {
          setLinks(newLinks);
          setShowLinksModal(false);
        }}
      />
    </>
  );
}
