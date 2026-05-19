// src/bot/keyboards.js
const { Markup } = require('telegraf');
const { REGIONS, CUISINES, PRICE_RANGES, HUNGER_LEVELS, VIBE_TAGS, MEAL_TYPES } = require('../utils/constants');

function regionKeyboard() {
  const buttons = REGIONS.map(r => Markup.button.callback(r, `region:${r}`));
  buttons.push(Markup.button.callback('🎲 Anywhere', 'region:any'));
  return Markup.inlineKeyboard(chunkArray(buttons, 3));
}

function priceKeyboard() {
  const buttons = PRICE_RANGES.map(p => Markup.button.callback(p, `price:${p}`));
  buttons.push(Markup.button.callback('💸 Any budget', 'price:any'));
  return Markup.inlineKeyboard(chunkArray(buttons, 2));
}

function cuisineKeyboard() {
  const popular = ['Japanese', 'Chinese', 'Korean', 'Western', 'Singaporean / Local', 'Thai', 'Indian', 'Cafe', 'Dessert'];
  const buttons = popular.map(c => Markup.button.callback(c, `cuisine:${c}`));
  buttons.push(Markup.button.callback('🍴 Any cuisine', 'cuisine:any'));
  return Markup.inlineKeyboard(chunkArray(buttons, 2));
}

function hungerKeyboard() {
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
    Markup.button.callback(label, `hunger:${val}`)
  );
  return Markup.inlineKeyboard(chunkArray(buttons, 2));
}

function vibeKeyboard() {
  const buttons = VIBE_TAGS.map(v => Markup.button.callback(v, `vibe:${v}`));
  buttons.push(Markup.button.callback('✨ Any vibe', 'vibe:any'));
  return Markup.inlineKeyboard(chunkArray(buttons, 2));
}

function mealTypeKeyboard() {
  const buttons = MEAL_TYPES.map(m => Markup.button.callback(m, `meal:${m}`));
  buttons.push(Markup.button.callback('🍽 Any', 'meal:any'));
  return Markup.inlineKeyboard(chunkArray(buttons, 3));
}

function yesNoKeyboard(yesCallback, noCallback) {
  return Markup.inlineKeyboard([
    Markup.button.callback('✅ Yes', yesCallback),
    Markup.button.callback('❌ No', noCallback)
  ]);
}

function ratingKeyboard() {
  const buttons = [1,2,3,4,5,6,7,8,9,10].map(n =>
    Markup.button.callback(String(n), `rating:${n}`)
  );
  return Markup.inlineKeyboard(chunkArray(buttons, 5));
}

// Multi-select vibe for /save — uses session state
function saveVibeKeyboard(selected = []) {
  const buttons = VIBE_TAGS.map(v => {
    const isSelected = selected.includes(v);
    return Markup.button.callback(`${isSelected ? '✅ ' : ''}${v}`, `savevibe:${v}`);
  });
  buttons.push(Markup.button.callback('✓ Done', 'savevibe:done'));
  return Markup.inlineKeyboard(chunkArray(buttons, 2));
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  regionKeyboard, priceKeyboard, cuisineKeyboard,
  hungerKeyboard, vibeKeyboard, mealTypeKeyboard,
  yesNoKeyboard, ratingKeyboard, saveVibeKeyboard
};
