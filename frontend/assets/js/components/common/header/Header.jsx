import HeaderHelper from './helpers/HeaderHelper.jsx';
import PendingApprovalPage from './PendingApprovalPage.jsx';
import useHeaderState from './hooks/useHeaderState.js';
import useHeaderAuthEffect from './hooks/useHeaderAuthEffect.js';
import useDomainConfigEffect from './hooks/useDomainConfigEffect.js';
import useHeaderControllers from './hooks/useHeaderControllers.js';

/**
 * Render application header, tracking authentication state and the login modal. Also gates the
 * requested route's content (issue #859): whenever the current user's account is `pending`
 * approval, the dedicated {@link PendingApprovalPage} is rendered below the nav bar instead of
 * `children`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} [props.children] - Requested route's page content, rendered unless
 *   the current user is awaiting approval.
 * @returns {React.ReactElement} Header element.
 */
export default function Header({ children }) {
  const { state, pendingApproval, setters } = useHeaderState();

  const { controller, viewAsController } = useHeaderControllers({
    ...setters,
    gameSlug: state.route.gameSlug,
  });

  useHeaderAuthEffect({
    controller,
    viewAsController,
    setFacadeEnabled: setters.setFacadeEnabled,
    loggedIn: state.loggedIn,
  });

  useDomainConfigEffect(state.domainConfig);

  return (
    <>
      {HeaderHelper.render(
        { ...state, canViewAs: state.canViewAs || Boolean(state.gameAccess.is_dm) },
        controller.buildHandlers(viewAsController, state.loggedIn)
      )}
      {pendingApproval ? <PendingApprovalPage /> : children}
    </>
  );
}
