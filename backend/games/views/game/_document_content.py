"""Shared implementation backing the character document files/photos-list endpoints."""

from django.shortcuts import get_object_or_404

from ..common import paginated_list_response
from ._shared import _get_character_or_404, _hidden_gate_response


def character_document_content(
    request, game, character_id, document_id, npc, check_hidden, content_attr, serializer_class,
    allow_hidden=False,
):
    """Return a paginated list of a character-held document's ready files or photos.

    Narrowed to a single `CharacterDocument`'s underlying `GameDocument`, read through
    `content_attr` (`'files'` or `'photos'`). Mirrors `_documents.py::character_documents`'s
    hidden-character gate (`check_hidden`) and hidden-document filtering (`allow_hidden`), plus
    a new incognito gate: an incognito character's list resolves to `[]` rather than 404ing,
    unless `allow_hidden` is set (the `/all.json` variant ignores incognito entirely, same as it
    ignores hidden state). `GameDocument.hidden` is never consulted — a character possessing a
    document may see its files/photos regardless of whether the DM has made the document public.
    """
    character = _get_character_or_404(game, character_id, npc)

    if check_hidden:
        error_response = _hidden_gate_response(character, request)
        if error_response:
            return error_response

    documents = character.character_documents.select_related('game_document')
    if not allow_hidden:
        documents = documents.exclude(hidden=True)
    document = get_object_or_404(documents, id=document_id)

    content = _document_content_queryset(document, content_attr, character, allow_hidden)
    response = paginated_list_response(
        request, content, serializer_class, context={'character_document_id': document.id},
    )
    if check_hidden and character.hidden:
        response['X-Skip-Cache'] = 'true'
    return response


def _document_content_queryset(document, content_attr, character, allow_hidden):
    """Return the ready files/photos queryset for `document`, or none() if incognito."""
    related_manager = getattr(document.game_document, content_attr)
    if not allow_hidden and character.incognito:
        return related_manager.none()
    return related_manager.filter(ready=True)
