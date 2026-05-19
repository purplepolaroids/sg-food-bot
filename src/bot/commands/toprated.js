// src/bot/commands/toprated.js
const { Markup } = require('telegraf');
const { getTopRated } = require('../../notion/client');
const { formatList } = require('../../formatters/card');
const { REGIONS } = require('../../utils/constants');

function topRegionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `topregion:${r}`));
  buttons.push(Markup.button.callback('🌍 All regions', 'topregion:any'));
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 3) chunks.push(buttons.slice(i, i + 3));
  return Markup.inlineKeyboard(chunks);
}

async function startTopRated(ctx) {
  await ctx.reply(
    '⭐ *Top Rated*\n\nFilter by region?',
    { parse_mode: 'MarkdownV2', ...topRegionKeyboard() }
  );
}

async function handleTopRatedRegion(ctx, region) {
  await ctx.editMessageText('⭐ Loading top picks\\.\\.\\.', { parse_mode: 'MarkdownV2' });

  try {
    const places = await getTopRated(region === 'any' ? null : region, 5);

    if (places.length === 0) {
      await ctx.editMessageText(
        '😔 No rated places found\\. Start adding spots with /save\\!',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const title = region === 'any' ? 'Your Top 5 Places ⭐' : `Top 5 in ${region} ⭐`;
    const msg = formatList(places, title);
    await ctx.editMessageText(msg, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error('/toprated error:', err);
    await ctx.editMessageText('❌ Something went wrong\\.', { parse_mode: 'MarkdownV2' });
  }
}

module.exports = { startTopRated, handleTopRatedRegion };
