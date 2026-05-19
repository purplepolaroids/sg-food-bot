// src/bot/commands/cravings.js
const { queryFood } = require('../../notion/client');
const { parseIntent, scoreResults } = require('../../ai/parseIntent');
const { formatList, escapeMd } = require('../../formatters/card');

async function handleCravings(ctx, text) {
  // Guard: empty text
  if (!text || text.trim().length === 0) {
    await ctx.reply(
      '💬 What are you craving\\? Try something like:\n\n_cheap supper near Central_\n_Japanese ramen_\n_aesthetic cafe to work at_',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  let thinking;
  try {
    thinking = await ctx.reply('🤖 Reading your cravings\\.\\.\\.', { parse_mode: 'MarkdownV2' });
  } catch (e) {
    return;
  }

  const editThinking = async (text, extra = {}) => {
    try {
      await ctx.telegram.editMessageText(ctx.chat.id, thinking.message_id, undefined, text, {
        parse_mode: 'MarkdownV2',
        ...extra
      });
    } catch (e) {
      // If edit fails (e.g. message too old), send a new one
      try { await ctx.reply(text, { parse_mode: 'MarkdownV2', ...extra }); } catch (_) {}
    }
  };

  try {
    const intent = await parseIntent(text);

    await editThinking(`🤖 *I'm reading:* ${escapeMd(intent.summary)}\n\n🔍 Searching\\.\\.\\.`);

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
      await editThinking(
        `🤖 *Looking for:* ${escapeMd(intent.summary)}\n\n😔 Nothing matched\\. Try /eat for manual filters or /save to add new spots\\!`
      );
      return;
    }

    const msg = `🤖 *${escapeMd(intent.summary)}*\n\n${formatList(top)}`;
    await editThinking(msg, { disable_web_page_preview: true });

  } catch (err) {
    console.error('/cravings error:', err.message);
    await editThinking('❌ Something went wrong\\. Try again or use /eat for manual filters\\!');
  }
}

module.exports = { handleCravings };
