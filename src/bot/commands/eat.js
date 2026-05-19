// src/bot/commands/eat.js
const { Markup } = require('telegraf');
const { queryFood } = require('../../notion/client');
const { scoreResults } = require('../../ai/parseIntent');
const { formatList } = require('../../formatters/card');
const { REGIONS } = require('../../utils/constants');

// In-memory session store
const sessions = {};

function getSession(userId) {
  if (!sessions[userId]) sessions[userId] = {};
  return sessions[userId];
}

function clearSession(userId) {
  sessions[userId] = {};
}

function eatRegionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `eatregion:${r}`));
  buttons.push(Markup.button.callback('🎲 Anywhere', 'eatregion:any'));
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 3) chunks.push(buttons.slice(i, i + 3));
  return Markup.inlineKeyboard(chunks);
}

function eatPriceKeyboard() {
  const prices = ['Under $10', '$10–20', '$20–30', '$30–50', '$50–100', '$100+'];
  const buttons = prices.map(p => Markup.button.callback(p, `eatprice:${p}`));
  buttons.push(Markup.button.callback('💸 Any budget', 'eatprice:any'));
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 2) chunks.push(buttons.slice(i, i + 2));
  return Markup.inlineKeyboard(chunks);
}

function eatCuisineKeyboard() {
  const popular = ['Japanese', 'Chinese', 'Korean', 'Western', 'Singaporean / Local', 'Thai', 'Indian', 'Cafe', 'Dessert'];
  const buttons = popular.map(c => Markup.button.callback(c, `eatcuisine:${c}`));
  buttons.push(Markup.button.callback('🍴 Any cuisine', 'eatcuisine:any'));
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 2) chunks.push(buttons.slice(i, i + 2));
  return Markup.inlineKeyboard(chunks);
}

function eatHungerKeyboard() {
  const labels = {
    'Nope not hungry':         '😶 Not hungry',
    'Just snacking':           '🍪 Just snacking',
    'Slightly hungry':         '🙂 Slightly hungry',
    'Hungry':                  '😋 Hungry',
    'Very hungry':             '😤 Very hungry',
    'Starving':                '😩 Starving',
    'Post-gym monster hunger': '🏋️ Post-gym'
  };
  const buttons = Object.entries(labels).map(([val, label]) =>
    Markup.button.callback(label, `eathunger:${val}`)
  );
  const chunks = [];
  for (let i = 0; i < buttons.length; i += 2) chunks.push(buttons.slice(i, i + 2));
  return Markup.inlineKeyboard(chunks);
}

async function startEat(ctx) {
  clearSession(ctx.from.id);
  await ctx.reply(
    '🍽 *Let\'s find you something to eat\\!*\n\nWhere are you right now?',
    { parse_mode: 'MarkdownV2', ...eatRegionKeyboard() }
  );
}

async function handleRegion(ctx, region) {
  const session = getSession(ctx.from.id);
  session.region = region;
  await ctx.editMessageText(
    `📍 *${region === 'any' ? 'Anywhere' : region}*\n\nWhat's your budget per pax?`,
    { parse_mode: 'MarkdownV2', ...eatPriceKeyboard() }
  );
}

async function handlePrice(ctx, price) {
  const session = getSession(ctx.from.id);
  session.priceRange = price;
  await ctx.editMessageText(
    `💰 *${price === 'any' ? 'Any budget' : price}*\n\nAny cuisine in mind?`,
    { parse_mode: 'MarkdownV2', ...eatCuisineKeyboard() }
  );
}

async function handleCuisine(ctx, cuisine) {
  const session = getSession(ctx.from.id);
  session.cuisine = cuisine;
  await ctx.editMessageText(
    `🍴 *${cuisine === 'any' ? 'Any cuisine' : cuisine}*\n\nHow hungry are you right now?`,
    { parse_mode: 'MarkdownV2', ...eatHungerKeyboard() }
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
