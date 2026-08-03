# Translator plan: Add document exchange

See [plan.md](plan.md) for the overview. New namespace `document_exchange_modal`, added to both
locale files right after the existing `item_exchange_modal` block (or anywhere consistent with
the file's existing ordering — check with `check_i18n` regardless).

## `frontend/assets/i18n/en.yaml`

```yaml
document_exchange_modal:
  title: Document Exchange
  search_placeholder: Search documents...
  acquire_tab: Acquire
  acquire_tab_tooltip: Acquire a copy of the document
  remove_tab: Remove
  remove_tab_tooltip: Removes a document
  hidden_label: Hidden
  confirm: Confirm
  cancel: Cancel
  back: Back
  cancel_selection: Cancel
  loading: Loading documents...
  empty: No documents available.
  load_error: Unable to load documents. Please try again.
  already_owned_error: This document is already owned.
  generic_error: Unable to complete this action. Please try again.
```

## `frontend/assets/i18n/pt.yaml`

```yaml
document_exchange_modal:
  title: Troca de Documento
  search_placeholder: Buscar documentos...
  acquire_tab: Adquirir
  acquire_tab_tooltip: Adquire uma cópia do documento
  remove_tab: Remover
  remove_tab_tooltip: Remove um documento
  hidden_label: Oculto
  confirm: Confirmar
  cancel: Cancelar
  back: Voltar
  cancel_selection: Cancelar
  loading: Carregando documentos...
  empty: Nenhum documento disponível.
  load_error: Falha ao carregar documentos. Por favor, tente novamente.
  already_owned_error: Este documento já foi adquirido.
  generic_error: Não foi possível concluir esta ação. Por favor, tente novamente.
```

Both files' key sets must stay identical (same 16 keys, same nesting) — verify with:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

(or `.claude/scripts/check_translations.sh`, the wrapper around the same script). This is the
full key set the frontend agent's new components/controllers reference — see `frontend.md` for
where each key is used (`AcquireDocumentTabController.js`'s error-key map, `documentExchangeTabs.js`'s
tab labels/tooltips, `AcquireDocumentTabHelper.jsx`/`RemoveDocumentTabHelper.jsx`'s rendered
copy).
