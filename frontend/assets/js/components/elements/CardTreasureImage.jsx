import defaultTreasurePhoto from '../../../images/default_treasure.png';

/**
 * Bootstrap card image for a treasure, always rendering the placeholder
 * image since there is no treasure photo upload flow yet.
 *
 * @param {object} props - Component props.
 * @param {string} props.alt - Alt text for the image.
 * @returns {React.ReactElement} Image element.
 */
export default function CardTreasureImage({ alt }) {
  return (
    <div className="card-photo-square">
      <img src={defaultTreasurePhoto} className="card-img-top" alt={alt} />
    </div>
  );
}
