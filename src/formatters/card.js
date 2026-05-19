// src/formatters/card.js
const { PRICE_EMOJI } = require('../utils/constants');

/**
 * Format a single restaurant as a Telegram message card.
 * Uses MarkdownV2 escaping.
 */
function formatCard(place, index) {
  const stars = '⭐'.repeat(Math.min(Math.round((place.personalRating || 0) / 2), 5));
  const priceIcon = PRICE_EMOJI[place.priceRange] || '💰';

  const lines = [];

  if (index !== undefined) {
    lines.push(`*${index + 1}\\. ${escapeMd(place.name)}* ${stars}`);
  } else {
    lines.push(`*${escapeMd(place.name)}* ${stars}`);
  }

  lines.push(`📍 ${escapeMd([place.area, place.region].filter(Boolean).join(', '))}`);
  lines.push(`${priceIcon} ${escapeMd(place.priceRange || '—')}${place.estimatedSpend ? ` \\(~\\$${place.estimatedSpend}/pax\\)` : ''}`);

  if (place.cuisines?.length) {
    lines.push(`🍽 ${escapeMd(place.cuisines.join(', '))}`);
  }

  if (place.vibeTags?.length) {
    lines.push(`✨ ${escapeMd(place.vibeTags.slice(0, 3).join(' · '))}`);
  }

  if (place.recommendedDishes) {
    lines.push(`👌 Try: ${escapeMd(place.recommendedDishes)}`);
  }

  if (place.queueWorthIt && place.queueWorthIt !== 'No Queue') {
    lines.push(`⏳ Queue worth it: ${escapeMd(place.queueWorthIt)}`);
  }

  if (place.mapsLink) {
    lines.push(`[📌 Google Maps](${place.mapsLink})`);
  }

  return lines.join('\n');
}

/**
 * Format a list of restaurants.
 */
function formatList(places, title = '') {
  if (places.length === 0) {
    return '😔 No places found\\. Try widening your filters\\!';
  }

  const cards = places.map((p, i) => formatCard(p, i));
  const header = title ? `*${escapeMd(title)}*\n\n` : '';
  return header + cards.join('\n\n\\-\\-\\-\n\n');
}

/**
 * Escape special MarkdownV2 characters.
 */
function escapeMd(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

module.exports = { formatCard, formatList, escapeMd };
