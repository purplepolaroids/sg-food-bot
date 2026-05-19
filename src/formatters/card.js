// src/formatters/card.js
const { PRICE_EMOJI } = require('../utils/constants');

function escapeMd(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

function formatCard(place, index) {
  if (!place) return 'No place data.';

  const stars = '⭐'.repeat(Math.min(Math.round((place.personalRating || 0) / 2), 5));
  const area = [place.area, place.region].filter(Boolean).join(', ');
  const price = place.priceRange || '—';
  const cuisine = (place.cuisines || []).slice(0, 2).join(', ');
  const dishes = place.recommendedDishes ? `👌 ${place.recommendedDishes.substring(0, 60)}` : '';
  const maps = place.mapsLink ? `\n${place.mapsLink}` : '';

  const header = typeof index === 'number'
    ? `${index+1}. ${place.name} ${stars}`
    : `${place.name} ${stars}`;

  return `${header}\n📍 ${area}\n💰 ${price}\n🍽 ${cuisine}\n${dishes}${maps}`.trim();
}

function formatList(places, title = '') {
  if (!places || places.length === 0) {
    return '😔 No places found. Try widening your filters!';
  }
  const cards = places.map((p, i) => formatCard(p, i));
  const header = title ? `${title}\n\n` : '';
  return header + cards.join('\n\n---\n\n');
}

module.exports = { formatCard, formatList, escapeMd };
