# Issue: Correct players list in game show page

## Description
In the game show page (`/#/games/:game_slug`), the characters and NPCs list still shows cards that are too big and displays the character's name as visible text.

## Problem
- Cards in the list are too big
- The character's name is shown as visible text

## Expected Behavior
- Cards should be smaller (reduced size for the images)
- The character's name should not be shown as visible text, but instead used as the image's alt text

## Solution
- Reduce the size of the cards with the images more, without affecting other pages
- Move the name of the character to the alt text of the image, without affecting other pages

---
See issue for details: https://github.com/darthjee/majora/issues/94
