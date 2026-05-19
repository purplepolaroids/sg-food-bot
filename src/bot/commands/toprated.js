// src/bot/commands/toprated.js
const { Markup } = require('telegraf');
const { getTopRated } = require('../../notion/client');
const { REGIONS } = require('../../utils/constants');

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function topRegionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `topregion:${r}`));
  buttons.push(Markup.button.callback('🌍 All regions', 'topregion:any'));
  return Markup.inlineKeyboard(chunk(buttons, 3));
}

async function startTopRated(ctx) {
  await ctx.reply('⭐ Top Rated\n\nFilter by region?', topRegionKeyboard());
}

async function handleTopRatedRegion(ctx, region) {
  await ctx.editMessageText('⭐ Loading top picks...');

  try {
    const places = await getTopRated(region === 'any' ? null : region, 5);

    if (places.length === 0) {
      await ctx.editMessageText('😔 No rated places found. Start adding spots with /save!');
      return;
    }

    const title = region === 'any' ? 'Your Top 5 Places ⭐' : `Top 5 in ${region} ⭐`;

    const lines = places.map((p, i) => {
      const stars = '⭐'.repeat(Math.min(Math.round((p.personalRating || 0) / 2), 5));
      const area = [p.area, p.region].filter(Boolean).join(', ');
      const price = p.priceRange || '—';
      const cuisine = (p.cuisines || []).slice(0, 2).join(', ');
      return `${i+1}. ${p.name} ${stars}\n📍 ${area}\n💰 ${price}\n🍽 ${cuisine}`.trim();
    });

    await ctx.editMessageText(`${title}\n\n${lines.join('\n\n---\n\n')}`, { disable_web_page_preview: true });
  } catch (err) {
    console.error('/toprated error:', err.message);
    await ctx.editMessageText('❌ Something went wrong. Try again!');
  }
}

module.exports = { startTopRated, handleTopRatedRegion };
