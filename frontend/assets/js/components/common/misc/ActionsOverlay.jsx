import React from 'react';
import CardPhoto from '../cards/CardPhoto.jsx';
import CardAvatar from '../cards/CardAvatar.jsx';
import CardTreasureImage from '../cards/CardTreasureImage.jsx';
import CardItemImage from '../cards/CardItemImage.jsx';
import CardPossessionImage from '../cards/CardPossessionImage.jsx';
import CardCommonItemImage from '../cards/CardCommonItemImage.jsx';
import CardDocumentImage from '../cards/CardDocumentImage.jsx';
import CardStlModelImage from '../cards/CardStlModelImage.jsx';
import CardSourceImage from '../cards/CardSourceImage.jsx';
import CardCollectionImage from '../cards/CardCollectionImage.jsx';
import CardFactionImage from '../cards/CardFactionImage.jsx';
import ActionBar from './ActionBar.jsx';
import InfoBar from './InfoBar.jsx';

const PHOTO_COMPONENTS = {
  avatar: CardAvatar,
  treasure: CardTreasureImage,
  item: CardItemImage,
  possession: CardPossessionImage,
  commonItem: CardCommonItemImage,
  document: CardDocumentImage,
  stl_model: CardStlModelImage,
  source: CardSourceImage,
  collection: CardCollectionImage,
  faction: CardFactionImage,
};

/**
 * Wraps a photo/avatar with a hover-reveal overlay hosting the photo-upload
 * button and any secondary action buttons.
 *
 * @description Renders the underlying photo/avatar unconditionally, and
 *   delegates the upload button and any secondary overlay action buttons
 *   (e.g. Slain/Revive) to {@link ActionBar}.
 * @param {object} props - Component props.
 * @param {'photo'|'avatar'|'treasure'|'item'|'possession'|'commonItem'|'document'|'stl_model'|'source'|'collection'|'faction'} [props.type] - Which
 *   underlying image component to render: `'avatar'` uses {@link CardAvatar}, `'treasure'` uses
 *   {@link CardTreasureImage}, `'item'` uses {@link CardItemImage}, `'possession'` uses
 *   {@link CardPossessionImage}, `'commonItem'` uses {@link CardCommonItemImage}, `'document'`
 *   uses {@link CardDocumentImage}, `'stl_model'` uses {@link CardStlModelImage}, `'source'` uses
 *   {@link CardSourceImage}, `'collection'` uses {@link CardCollectionImage}, `'faction'` uses
 *   {@link CardFactionImage}, anything else (default) uses {@link CardPhoto}.
 * @param {string|null} [props.url] - Image URL, or null/undefined to use the default photo.
 * @param {string} props.alt - Alt text for the image.
 * @param {boolean} [props.canEdit] - Whether the current user may upload a new photo.
 * @param {Function} props.onClick - Handler invoked when the upload button is clicked.
 * @param {boolean} [props.grayscale] - Whether to render the photo in grayscale.
 * @param {boolean} [props.dimmed] - Whether to render the photo with reduced opacity
 *   (e.g. a hidden NPC).
 * @param {object} [props.overlayItems] - Optional overlay content groups.
 * @param {{label: string, variant: string, icon: string, onClick: Function}[]} [props.overlayItems.secondaryButtons] -
 *   Optional secondary overlay buttons (e.g. real/public Slain-Revive), stacked at the bottom
 *   right, rendered when the primary upload button is present on the left.
 * @param {object[]} [props.overlayItems.infoBarItems] - Optional informational (non-interactive)
 *   items rendered in the always-visible {@link InfoBar} at the top of the overlay.
 * @param {string} [props.photoClassName] - Optional class name forwarded to the underlying
 *   photo component, overriding its default (e.g. a rectangular instead of square photo box).
 *   Ignored by every `PHOTO_COMPONENTS` entry other than the default {@link CardPhoto}.
 * @returns {React.ReactElement} Rendered photo/avatar with optional upload/secondary overlay buttons.
 */
export default function ActionsOverlay({
  type, url, alt, canEdit, onClick, grayscale = false, dimmed = false, overlayItems = {}, photoClassName,
}) {
  const { secondaryButtons = [], infoBarItems = [] } = overlayItems;
  const Photo = PHOTO_COMPONENTS[type] || CardPhoto;
  const className = `actions-overlay${grayscale ? ' photo-grayscale' : ''}${dimmed ? ' photo-hidden' : ''}`;

  return (
    <div className={className}>
      <Photo url={url} alt={alt} className={photoClassName} />
      <InfoBar items={infoBarItems} />
      <ActionBar canEdit={canEdit} onClick={onClick} secondaryButtons={secondaryButtons} />
    </div>
  );
}
