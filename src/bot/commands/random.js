// src/bot/commands/random.js
const { getRandomFood } = require('../../notion/client');
const { formatCard } = require('../../formatters/card');
const { regionKeyboard } = require('../keyboards');

async function startRandom(ctx) {
  await ctx.reply(
    '🎲 *Random pick\\!*\n\nFilter by region, or go full random?',
    { parse_mode: 'MarkdownV2', ...regionKeyboard() }
  );
}

async function handleRandomRegion(ctx, region) {
  await ctx.editMessageText('🎲 Picking something\\.\\.\\.', { parse_mode: 'MarkdownV2' });

  try {
    const place = await getRandomFood(region === 'any' ? null : region);

    if (!place) {
      await ctx.editMessageText(
        '😔 No places found for that region\\. Try adding more spots with /save\\!',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const msg = `🎲 *Tonight you\'re going to\\.\\.\\.*\n\n${formatCard(place)}`;
    await ctx.editMessageText(msg, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true
    });
  } catch (err) {
    console.error('/random error:', err);
    await ctx.editMessageText('❌ Something went wrong\\.', { parse_mode: 'MarkdownV2' });
  }
}

module.exports = { startRandom, handleRandomRegion };
