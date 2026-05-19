// src/bot/commands/cravings.js
const { queryFood } = require('../../notion/client');
const { parseIntent, scoreResults } = require('../../ai/parseIntent');
const { formatList, escapeMd } = require('../../formatters/card');

async function handleCravings(ctx, text) {
  const thinking = await ctx.reply('🤖 Reading your cravings\\.\\.\\.', { parse_mode: 'MarkdownV2' });

  try {
    const intent = await parseIntent(text);

    // Show what we understood
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinking.message_id,
      undefined,
      `🤖 *I\'m reading:* ${escapeMd(intent.summary)}\n\n🔍 Searching\\.\\.\\.`,
      { parse_mode: 'MarkdownV2' }
    );

    const results = await queryFood({
      region: intent.region,
      cuisine: intent.cuisine,
      priceRange: intent.priceRange,
      mealType: intent.mealType,
      hunger: intent.hunger,
      vibeTag: intent.vibeTag,
      limit: 10
    });

    const scored = scoreResults(results, intent);
    const top = scored.slice(0, 3);

    if (top.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        undefined,
        `🤖 *I was looking for:* ${escapeMd(intent.summary)}\n\n😔 Nothing matched\\. Try /eat to use manual filters, or /save to add new spots\\!`,
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    const header = `🤖 *${escapeMd(intent.summary)}*`;
    const msg = `${header}\n\n${formatList(top)}`;
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinking.message_id,
      undefined,
      msg,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
  } catch (err) {
    console.error('/cravings error:', err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinking.message_id,
      undefined,
      '❌ Something went wrong\\. Try again\\!',
      { parse_mode: 'MarkdownV2' }
    );
  }
}

module.exports = { handleCravings };
