// src/bot/commands/random.js
const { Markup } = require('telegraf');
const { getRandomFood } = require('../../notion/client');
const { REGIONS } = require('../../utils/constants');

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function randomRegionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `randomregion:${r}`));
  buttons.push(Markup.button.callback('🎲 Anywhere', 'randomregion:any'));
  return Markup.inlineKeyboard(chunk(buttons, 3));
}

async function startRandom(ctx) {
  await ctx.reply('🎲 Random pick!\n\nFilter by region, or go full random?', randomRegionKeyboard());
}

async function handleRandomRegion(ctx, region) {
  await ctx.editMessageText('🎲 Picking something...');

  try {
    const place = await getRandomFood(region === 'any' ? null : region);

    if (!place) {
      await ctx.editMessageText('😔 No places found for that region. Try adding more with /save!');
      return;
    }

    const stars = '⭐'.repeat(Math.min(Math.round((place.personalRating || 0) / 2), 5));
    const area = [place.area, place.region].filter(Boolean).join(', ');
    const price = place.priceRange || '—';
    const cuisine = (place.cuisines || []).slice(0, 2).join(', ');
    const dishes = place.recommendedDishes ? `👌 Try: ${place.recommendedDishes.substring(0, 80)}` : '';
    const maps = place.mapsLink ? `\n${place.mapsLink}` : '';
    const notes = place.notes ? `\n💬 ${place.notes.substring(0, 100)}` : '';

    const msg = `🎲 Tonight, you should go to...\n\n${place.name} ${stars}\n📍 ${area}\n💰 ${price}\n🍽 ${cuisine}\n${dishes}${notes}${maps}`.trim();

    await ctx.editMessageText(msg, { disable_web_page_preview: true });
  } catch (err) {
    console.error('/random error:', err.message);
    await ctx.editMessageText('❌ Something went wrong. Try again!');
  }
}

module.exports = { startRandom, handleRandomRegion };
