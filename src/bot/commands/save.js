// src/bot/commands/save.js
const { saveRestaurant } = require('../../notion/client');
const { escapeMd } = require('../../formatters/card');
const {
  regionKeyboard, priceKeyboard, cuisineKeyboard,
  ratingKeyboard, saveVibeKeyboard, yesNoKeyboard
} = require('../keyboards');
const { Markup } = require('telegraf');

// Session store for /save wizard
const saveSessions = {};

function getSession(userId) {
  if (!saveSessions[userId]) saveSessions[userId] = { step: 'idle', data: {}, vibes: [] };
  return saveSessions[userId];
}

function clearSession(userId) {
  saveSessions[userId] = { step: 'idle', data: {}, vibes: [] };
}

async function startSave(ctx) {
  clearSession(ctx.from.id);
  const session = getSession(ctx.from.id);
  session.step = 'name';

  await ctx.reply(
    '🍴 *Add a new restaurant\\!*\n\nWhat\'s the restaurant name?',
    { parse_mode: 'MarkdownV2' }
  );
}

async function handleSaveText(ctx, text) {
  const session = getSession(ctx.from.id);
  if (session.step === 'idle') return false;

  switch (session.step) {
    case 'name':
      session.data.name = text;
      session.step = 'region';
      await ctx.reply(
        `Got it\\! *${escapeMd(text)}*\n\nWhich region?`,
        { parse_mode: 'MarkdownV2', ...regionKeyboard() }
      );
      return true;

    case 'dishes':
      session.data.recommendedDishes = text;
      session.step = 'rating';
      await ctx.reply(
        '⭐ Personal rating? \\(1–10\\)',
        { parse_mode: 'MarkdownV2', ...ratingKeyboard() }
      );
      return true;

    case 'notes':
      session.data.notes = text === 'skip' ? '' : text;
      await finishSave(ctx, session);
      return true;
  }

  return false;
}

async function handleSaveRegion(ctx, region) {
  const session = getSession(ctx.from.id);
  session.data.region = region === 'any' ? null : region;
  session.step = 'price';
  await ctx.editMessageText(
    `📍 *${escapeMd(region === 'any' ? 'No specific region' : region)}*\n\nPrice range per pax?`,
    { parse_mode: 'MarkdownV2', ...priceKeyboard() }
  );
}

async function handleSavePrice(ctx, price) {
  const session = getSession(ctx.from.id);
  session.data.priceRange = price === 'any' ? null : price;
  session.step = 'cuisine';
  await ctx.editMessageText(
    `💰 *${escapeMd(price === 'any' ? 'Any price' : price)}*\n\nCuisine type?`,
    { parse_mode: 'MarkdownV2', ...cuisineKeyboard() }
  );
}

async function handleSaveCuisine(ctx, cuisine) {
  const session = getSession(ctx.from.id);
  session.data.cuisines = cuisine === 'any' ? [] : [cuisine];
  session.step = 'dishes';
  await ctx.editMessageText(
    `🍽 *${escapeMd(cuisine === 'any' ? 'Any cuisine' : cuisine)}*\n\nAny recommended dishes? \\(or type *skip*\\)`,
    { parse_mode: 'MarkdownV2' }
  );
}

async function handleSaveRating(ctx, rating) {
  const session = getSession(ctx.from.id);
  session.data.personalRating = parseInt(rating);
  session.step = 'revisit';
  await ctx.editMessageText(
    `⭐ *${rating}/10*\n\nWould you revisit?`,
    { parse_mode: 'MarkdownV2', ...yesNoKeyboard('saverevisit:yes', 'saverevisit:no') }
  );
}

async function handleSaveRevisit(ctx, revisit) {
  const session = getSession(ctx.from.id);
  session.data.wouldRevisit = revisit === 'yes';
  session.step = 'vibes';
  session.vibes = [];
  await ctx.editMessageText(
    `${revisit === 'yes' ? '✅' : '❌'} Got it\\!\n\nPick vibe tags \\(tap to toggle, then Done\\):`,
    { parse_mode: 'MarkdownV2', ...saveVibeKeyboard([]) }
  );
}

async function handleSaveVibe(ctx, vibe) {
  const session = getSession(ctx.from.id);
  if (vibe === 'done') {
    session.data.vibeTags = session.vibes;
    session.step = 'notes';
    await ctx.editMessageText(
      `✨ *${escapeMd(session.vibes.join(', ') || 'No vibes selected')}*\n\nAny personal notes? \\(or type *skip*\\)`,
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  // Toggle vibe selection
  const idx = session.vibes.indexOf(vibe);
  if (idx > -1) {
    session.vibes.splice(idx, 1);
  } else {
    session.vibes.push(vibe);
  }

  await ctx.editMessageReplyMarkup(saveVibeKeyboard(session.vibes).reply_markup);
}

async function finishSave(ctx, session) {
  try {
    await ctx.reply('💾 Saving\\.\\.\\.', { parse_mode: 'MarkdownV2' });
    const pageId = await saveRestaurant(session.data);

    const notionUrl = `https://notion.so/${pageId.replace(/-/g, '')}`;
    await ctx.reply(
      `✅ *${escapeMd(session.data.name)}* saved to your database\\!\n\n` +
      `📍 ${escapeMd(session.data.region || '—')}\n` +
      `💰 ${escapeMd(session.data.priceRange || '—')}\n` +
      `⭐ ${session.data.personalRating || '—'}/10\n\n` +
      `[View in Notion](${notionUrl})`,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
  } catch (err) {
    console.error('/save error:', err);
    await ctx.reply('❌ Failed to save\\. Try again with /save\\.', { parse_mode: 'MarkdownV2' });
  }

  clearSession(ctx.from.id);
}

function isInSaveFlow(userId) {
  return saveSessions[userId]?.step && saveSessions[userId].step !== 'idle';
}

module.exports = {
  startSave, handleSaveText, handleSaveRegion, handleSavePrice,
  handleSaveCuisine, handleSaveRating, handleSaveRevisit,
  handleSaveVibe, isInSaveFlow
};
