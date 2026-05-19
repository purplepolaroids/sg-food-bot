// src/bot/commands/eat.js
const { Markup } = require('telegraf');
const { queryFood } = require('../../notion/client');
const { scoreResults } = require('../../ai/parseIntent');
const { formatList, escapeMd } = require('../../formatters/card');
const { REGIONS } = require('../../utils/constants');

const sessions = {};

function getSession(userId) {
  if (!sessions[userId]) sessions[userId] = {};
  return sessions[userId];
}
function clearSession(userId) { sessions[userId] = {}; }

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function eatRegionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `eatregion:${r}`));
  buttons.push(Markup.button.callback('🎲 Anywhere', 'eatregion:any'));
  return Markup.inlineKeyboard(chunk(buttons, 3));
}

function eatPriceKeyboard() {
  const prices = ['Under $10', '$10–20', '$20–30', '$30–50', '$50–100', '$100+'];
  const buttons = prices.map(p => Markup.button.callback(p, `eatprice:${p}`));
  buttons.push(Markup.button.callback('💸 Any budget', 'eatprice:any'));
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

function eatCuisineKeyboard() {
  const list = ['Japanese', 'Chinese', 'Korean', 'Western', 'Singaporean / Local', 'Thai', 'Indian', 'Malay', 'Cafe', 'Dessert'];
  const buttons = list.map(c => Markup.button.callback(c, `eatcuisine:${c}`));
  buttons.push(Markup.button.callback('🍴 Any', 'eatcuisine:any'));
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

function eatHungerKeyboard() {
  const labels = {
    'Nope not hungry':         '😶 Not hungry',
    'Just snacking':           '🍪 Snacking',
    'Slightly hungry':         '🙂 Slightly hungry',
    'Hungry':                  '😋 Hungry',
    'Very hungry':             '😤 Very hungry',
    'Starving':                '😩 Starving',
    'Post-gym monster hunger': '🏋 Post-gym'
  };
  const buttons = Object.entries(labels).map(([val, label]) =>
    Markup.button.callback(label, `eathunger:${val}`)
  );
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

async function startEat(ctx) {
  clearSession(ctx.from.id);
  await ctx.reply('🍽 Let\'s find you something to eat!\n\nWhere are you right now?', {
    ...eatRegionKeyboard()
  });
}

async function handleRegion(ctx, region) {
  const session = getSession(ctx.from.id);
  session.region = region;
  const label = region === 'any' ? 'Anywhere' : region;
  await ctx.editMessageText(`📍 ${label}\n\nWhat's your budget per pax?`, {
    ...eatPriceKeyboard()
  });
}

async function handlePrice(ctx, price) {
  const session = getSession(ctx.from.id);
  session.priceRange = price;
  const label = price === 'any' ? 'Any budget' : price;
  await ctx.editMessageText(`💰 ${label}\n\nAny cuisine in mind?`, {
    ...eatCuisineKeyboard()
  });
}

async function handleCuisine(ctx, cuisine) {
  const session = getSession(ctx.from.id);
  session.cuisine = cuisine;
  const label = cuisine === 'any' ? 'Any cuisine' : cuisine;
  await ctx.editMessageText(`🍴 ${label}\n\nHow hungry are you?`, {
    ...eatHungerKeyboard()
  });
}

async function handleHunger(ctx, hunger) {
  const session = getSession(ctx.from.id);
  session.hunger = hunger;

  await ctx.editMessageText('🔍 Searching...');

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
      await ctx.editMessageText('😔 No exact matches found. Try broader filters with /eat, or use /random for a surprise!');
    } else {
      const lines = top.map((p, i) => {
        const stars = '⭐'.repeat(Math.min(Math.round((p.personalRating || 0) / 2), 5));
        const price = p.priceRange || '—';
        const area = [p.area, p.region].filter(Boolean).join(', ');
        const cuisine = (p.cuisines || []).slice(0, 2).join(', ');
        const dishes = p.recommendedDishes ? `👌 ${p.recommendedDishes.substring(0, 60)}` : '';
        const maps = p.mapsLink ? p.mapsLink : '';
        return `${i+1}. ${p.name} ${stars}\n📍 ${area}\n💰 ${price}\n🍽 ${cuisine}\n${dishes}\n${maps}`.trim();
      });
      await ctx.editMessageText(`🍜 Found ${top.length} spot${top.length > 1 ? 's' : ''} for you!\n\n${lines.join('\n\n---\n\n')}`, { disable_web_page_preview: true });
    }
  } catch (err) {
    console.error('/eat error:', err.message);
    await ctx.editMessageText('❌ Something went wrong. Try again with /eat.');
  }

  clearSession(ctx.from.id);
}

module.exports = { startEat, handleRegion, handlePrice, handleCuisine, handleHunger };
