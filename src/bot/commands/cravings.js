// src/bot/commands/cravings.js
const { queryFood } = require('../../notion/client');
const { parseIntent, scoreResults } = require('../../ai/parseIntent');

async function handleCravings(ctx, text) {
  if (!text || text.trim().length === 0) {
    await ctx.reply('💬 What are you craving? Try something like:\n\n• cheap supper near Central\n• Japanese ramen\n• aesthetic cafe to work at\n• something cozy and filling');
    return;
  }

  let thinking;
  try {
    thinking = await ctx.reply('🤖 Reading your cravings...');
  } catch (e) {
    return;
  }

  const edit = async (text) => {
    try {
      await ctx.telegram.editMessageText(ctx.chat.id, thinking.message_id, undefined, text, { disable_web_page_preview: true });
    } catch (e) {
      try { await ctx.reply(text, { disable_web_page_preview: true }); } catch (_) {}
    }
  };

  try {
    const intent = await parseIntent(text);

    await edit(`🤖 Reading: ${intent.summary}\n\n🔍 Searching...`);

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
      await edit(`🤖 Looking for: ${intent.summary}\n\n😔 Nothing matched. Try /eat for manual filters or /save to add new spots!`);
      return;
    }

    const lines = top.map((p, i) => {
      const stars = '⭐'.repeat(Math.min(Math.round((p.personalRating || 0) / 2), 5));
      const area = [p.area, p.region].filter(Boolean).join(', ');
      const price = p.priceRange || '—';
      const cuisine = (p.cuisines || []).slice(0, 2).join(', ');
      const dishes = p.recommendedDishes ? `👌 ${p.recommendedDishes.substring(0, 60)}` : '';
      const maps = p.mapsLink ? `\n${p.mapsLink}` : '';
      return `${i+1}. ${p.name} ${stars}\n📍 ${area}\n💰 ${price}\n🍽 ${cuisine}\n${dishes}${maps}`.trim();
    });

    await edit(`🤖 ${intent.summary}\n\n${lines.join('\n\n---\n\n')}`);

  } catch (err) {
    console.error('/cravings error:', err.message);
    await edit('❌ Something went wrong. Try again or use /eat for manual filters!');
  }
}

module.exports = { handleCravings };
