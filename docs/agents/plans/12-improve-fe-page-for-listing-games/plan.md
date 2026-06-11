# Plan: Improve FE Page for Listing Games

## Overview

Two-part change: add a cover image field to the `Game` model on the backend so each game can
display an image, then improve the frontend Games listing page with Bootstrap cards, game images,
and a full pagination UI.

## Sub-plans

- [Backend — Add image field to Game](plan_backend.md)
- [Frontend — Bootstrap layout, GameCard, and Pagination](plan_frontend.md)

## High-level Steps

1. Add `photo` URL field to `Game` model and expose it in the list serializer *(backend)*
2. Import Bootstrap globally in `main.jsx` *(frontend)*
3. Create the Pagination element set (ported from `oak`) *(frontend)*
4. Create `GameCard.jsx` using the new `photo` field *(frontend)*
5. Create `GamesHelper.jsx` with `render`, `renderLoading`, `renderError` *(frontend)*
6. Update `Games.jsx` to delegate to `GamesHelper` *(frontend)*
7. Add Jasmine specs for all new frontend files *(frontend)*

## Notes

- The backend change must land before (or together with) the frontend card change so the
  `photo` field is available in the API response.
- See each sub-plan for file-level details and open questions.
