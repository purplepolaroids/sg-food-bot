// src/bot/commands/eat.js
const { queryFood } = require('../../notion/client');
const { scoreResults } = require('../../ai/parseIntent');
const { formatList } = require('../../formatters/card');
const {
  regionKeyboard, priceKeyboard, cuisineKeyboard, hungerKeyboard
} = require('../keyboards');

// In-memory session store (good enough for single-user bot)
const sessions = {};

function getSession(userId) {
  if (!sessions[userId]) sessions[userId] = {};
  return sessions[userId];
}

function clearSession(userId) {
  sessions[userId] = {};
}

async function startEat(ctx) {
  clearSession(ctx.from.id);
  await ctx.reply(
    '🍽 *Let\'s find you something to eat\\!*\n\nWhere are you right now?',
    { parse_mode: 'MarkdownV2', ...regionKeyboard() }
  );
}

async function handleRegion(ctx, region) {
  const session = getSession(ctx.from.id);
  session.region = region;
  await ctx.editMessageText(
    `📍 *${region === 'any' ? 'Anywhere' : region}*\n\nWhat\'s your budget per pax?`,
    { parse_mode: 'MarkdownV2', ...priceKeyboard() }
  );
}

async function handlePrice(ctx, price) {
  const session = getSession(ctx.from.id);
  session.priceRange = price;
  await ctx.editMessageText(
    `💰 *${price === 'any' ? 'Any budget' : price}*\n\nAny cuisine in mind?`,
    { parse_mode: 'MarkdownV2', ...cuisineKeyboard() }
  );
}

async function handleCuisine(ctx, cuisine) {
  const session = getSession(ctx.from.id);
  session.cuisine = cuisine;
  await ctx.editMessageText(
    `🍴 *${cuisine === 'any' ? 'Any cuisine' : cuisine}*\n\nHow hungry are you right now?`,
    { parse_mode: 'MarkdownV2', ...hungerKeyboard() }
  );
}

async function handleHunger(ctx, hunger) {
  const session = getSession(ctx.from.id);
  session.hunger = hunger;

  await ctx.editMessageText('🔍 Searching\\.\\.\\.', { parse_mode: 'MarkdownV2' });

  try {
    const results = await queryFood({
      region: session.region,
      cuisine: session.cuisine,
      priceRange: session.priceRange,
      hunger: session.hunger,
      limit: 10
    });

    const scored = scoreResults(results, session);
    const top = scored.slice(0, 3);

    if (top.length === 0) {
      await ctx.editMessageText(
        '😔 No exact matches found\\. Try widening your filters with /eat again, or use /random for a surprise pick\\!',
        { parse_mode: 'MarkdownV2' }
      );
    } else {
      const msg = formatList(top, `Found ${top.length} place${top.length > 1 ? 's' : ''} for you 🍜`);
      await ctx.editMessageText(msg, { parse_mode: 'MarkdownV2', disable_web_page_preview: true });
    }
  } catch (err) {
    console.error('/eat query error:', err);
    await ctx.editMessageText('❌ Something went wrong\\. Try again in a moment\\.', { parse_mode: 'MarkdownV2' });
  }

  clearSession(ctx.from.id);
}

module.exports = { startEat, handleRegion, handlePrice, handleCuisine, handleHunger };
