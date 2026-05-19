// src/formatters/card.js
const { PRICE_EMOJI } = require('../utils/constants');

/**
 * Escape ALL special MarkdownV2 characters.
 * This is the single source of truth — always use this before inserting any dynamic text.
 */
function escapeMd(text) {
  if (text === null || text === undefined) return '';
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Format a single restaurant as a Telegram MarkdownV2 card.
 * Safe against null/undefined fields, long text, special characters.
 */
function formatCard(place, index) {
  if (!place) return '😔 No place data available\\.';

  const rating = place.personalRating || 0;
  const starCount = Math.min(Math.round(rating / 2), 5);
  const stars = starCount > 0 ? '⭐'.repeat(starCount) : '';
  const priceIcon = PRICE_EMOJI[place.priceRange] || '💰';

  const lines = [];

  // Name line
  const name = escapeMd(place.name || 'Unknown place');
  if (typeof index === 'number') {
    lines.push(`*${index + 1}\\. ${name}* ${stars}`);
  } else {
    lines.push(`*${name}* ${stars}`);
  }

  // Location
  const locationParts = [place.area, place.region].filter(Boolean).map(escapeMd);
  if (locationParts.length > 0) {
    lines.push(`📍 ${locationParts.join(', ')}`);
  }

  // Price
  const priceText = escapeMd(place.priceRange || '—');
  const spendText = place.estimatedSpend ? ` \\(~\\$${place.estimatedSpend}/pax\\)` : '';
  lines.push(`${priceIcon} ${priceText}${spendText}`);

  // Cuisine
  if (place.cuisines?.length) {
    lines.push(`🍽 ${escapeMd(place.cuisines.slice(0, 3).join(', '))}`);
  }

  // Vibe tags
  if (place.vibeTags?.length) {
    lines.push(`✨ ${escapeMd(place.vibeTags.slice(0, 3).join(' · '))}`);
  }

  // Recommended dishes — truncate if too long
  if (place.recommendedDishes) {
    const dishes = place.recommendedDishes.length > 80
      ? place.recommendedDishes.substring(0, 77) + '...'
      : place.recommendedDishes;
    lines.push(`👌 Try: ${escapeMd(dishes)}`);
  }

  // Maps link — only if valid URL
  if (place.mapsLink && place.mapsLink.startsWith('http')) {
    lines.push(`[📌 Maps](${place.mapsLink})`);
  }

  return lines.join('\n');
}

/**
 * Format a list of restaurants with a title.
 */
function formatList(places, title = '') {
  if (!places || places.length === 0) {
    return '😔 No places found\\. Try widening your filters\\!';
  }

  const cards = places.map((p, i) => formatCard(p, i));
  const header = title ? `*${escapeMd(title)}*\n\n` : '';
  return header + cards.join('\n\n\\-\\-\\-\n\n');
}

module.exports = { formatCard, formatList, escapeMd };
