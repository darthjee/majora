"""View-implementation-level decorators for games/views/game/ (issue #946).

Unlike backend/games/decorators.py (cache-tier decorators applied to the outer @api_view-wrapped
views), this module holds decorators that transform the shared character_xxx(...) implementation
functions' own arguments.
"""

from functools import wraps

from ._shared import _get_character_or_404, _hidden_gate_response


def check_hidden(view_func):
    """Decorate a character_xxx(request, game, character, ...) function.

    Resolves `character` from `(game, character_id, npc)` and, when `check_hidden` is True,
    404s (via `_hidden_gate_response`) if the character is hidden and the requester cannot edit
    it. `character_id`/`npc` are consumed here and never reach `view_func`, which instead
    receives the resolved `character`. `check_hidden` itself IS still forwarded (as a keyword)
    since callers keep their own check_hidden-guarded cache-header line unchanged.
    """

    @wraps(view_func)
    def wrapper(request, game, character_id, *args, npc, check_hidden, **kwargs):
        """Resolve `character` and gate on hidden state before delegating to `view_func`."""
        character = _get_character_or_404(game, character_id, npc)
        if check_hidden:
            error_response = _hidden_gate_response(character, request)
            if error_response:
                return error_response
        return view_func(request, game, character, *args, check_hidden=check_hidden, **kwargs)

    return wrapper
