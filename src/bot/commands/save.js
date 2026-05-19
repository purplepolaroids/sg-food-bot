// src/bot/commands/save.js
const { Markup } = require('telegraf');
const { saveRestaurant } = require('../../notion/client');
const { escapeMd } = require('../../formatters/card');

const saveSessions = {};

function getSession(userId) {
  if (!saveSessions[userId]) saveSessions[userId] = { step: 'idle', data: {}, vibes: [] };
  return saveSessions[userId];
}
function clearSession(userId) {
  saveSessions[userId] = { step: 'idle', data: {}, vibes: [] };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function saveRegionKeyboard() {
  const regions = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];
  const buttons = regions.map(r => Markup.button.callback(r, `saveregion:${r}`));
  buttons.push(Markup.button.callback('Not sure', 'saveregion:any'));
  return Markup.inlineKeyboard(chunk(buttons, 3));
}

function savePriceKeyboard() {
  const prices = ['Under $10', '$10\u201320', '$20\u201330', '$30\u201350', '$50\u2013100', '$100+'];
  const buttons = prices.map(p => Markup.button.callback(p, `saveprice:${p}`));
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

function saveCuisineKeyboard() {
  const list = ['Japanese', 'Chinese', 'Korean', 'Western', 'Singaporean / Local', 'Thai', 'Indian', 'Malay', 'Cafe', 'Dessert', 'Seafood', 'Fusion'];
  const buttons = list.map(c => Markup.button.callback(c, `savecuisine:${c}`));
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

function ratingKeyboard() {
  const buttons = [1,2,3,4,5,6,7,8,9,10].map(n =>
    Markup.button.callback(String(n), `rating:${n}`)
  );
  return Markup.inlineKeyboard(chunk(buttons, 5));
}

function yesNoKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Yes', 'saverevisit:yes'), Markup.button.callback('❌ No', 'saverevisit:no')]
  ]);
}

const VIBE_TAGS = ['Cozy', 'Date night', 'Aesthetic', 'Solo dining', 'Work-friendly', 'Casual', 'Fancy', 'Hidden gem', 'Late night', 'Family-friendly'];

function saveVibeKeyboard(selected = []) {
  const buttons = VIBE_TAGS.map(v => {
    const isSelected = selected.includes(v);
    return Markup.button.callback(`${isSelected ? '✅ ' : ''}${v}`, `savevibe:${v}`);
  });
  buttons.push(Markup.button.callback('✓ Done', 'savevibe:done'));
  return Markup.inlineKeyboard(chunk(buttons, 2));
}

async function startSave(ctx) {
  clearSession(ctx.from.id);
  const session = getSession(ctx.from.id);
  session.step = 'name';
  await ctx.reply('🍴 *Add a new restaurant\\!*\n\nWhat\'s the name?', { parse_mode: 'MarkdownV2' });
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
        { parse_mode: 'MarkdownV2', ...saveRegionKeyboard() }
      );
      return true;

    case 'dishes':
      session.data.recommendedDishes = text === 'skip' ? '' : text;
      session.step = 'rating';
      await ctx.reply('⭐ Personal rating? \\(1–10\\)', {
        parse_mode: 'MarkdownV2',
        ...ratingKeyboard()
      });
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
  const label = region === 'any' ? 'No specific region' : region;
  await ctx.editMessageText(
    `📍 *${escapeMd(label)}*\n\nPrice range per pax?`,
    { parse_mode: 'MarkdownV2', ...savePriceKeyboard() }
  );
}

async function handleSavePrice(ctx, price) {
  const session = getSession(ctx.from.id);
  session.data.priceRange = price;
  session.step = 'cuisine';
  await ctx.editMessageText(
    `💰 *${escapeMd(price)}*\n\nCuisine type?`,
    { parse_mode: 'MarkdownV2', ...saveCuisineKeyboard() }
  );
}

async function handleSaveCuisine(ctx, cuisine) {
  const session = getSession(ctx.from.id);
  session.data.cuisines = [cuisine];
  session.step = 'dishes';
  await ctx.editMessageText(
    `🍽 *${escapeMd(cuisine)}*\n\nAny recommended dishes? \\(or type *skip*\\)`,
    { parse_mode: 'MarkdownV2' }
  );
}

async function handleSaveRating(ctx, rating) {
  const session = getSession(ctx.from.id);
  session.data.personalRating = parseInt(rating);
  session.step = 'revisit';
  await ctx.editMessageText(
    `⭐ *${rating}/10*\n\nWould you revisit?`,
    { parse_mode: 'MarkdownV2', ...yesNoKeyboard() }
  );
}

async function handleSaveRevisit(ctx, revisit) {
  const session = getSession(ctx.from.id);
  session.data.wouldRevisit = revisit === 'yes';
  session.step = 'vibes';
  session.vibes = [];
  const icon = revisit === 'yes' ? '✅' : '❌';
  await ctx.editMessageText(
    `${icon} Got it\\!\n\nPick vibe tags \\(tap to toggle, then Done\\):`,
    { parse_mode: 'MarkdownV2', ...saveVibeKeyboard([]) }
  );
}

async function handleSaveVibe(ctx, vibe) {
  const session = getSession(ctx.from.id);

  if (vibe === 'done') {
    session.data.vibeTags = [...session.vibes];
    session.step = 'notes';
    const vibeText = session.vibes.length > 0 ? session.vibes.join(', ') : 'None selected';
    await ctx.editMessageText(
      `✨ *${escapeMd(vibeText)}*\n\nAny personal notes? \\(or type *skip*\\)`,
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }

  const idx = session.vibes.indexOf(vibe);
  if (idx > -1) {
    session.vibes.splice(idx, 1);
  } else {
    session.vibes.push(vibe);
  }

  try {
    await ctx.editMessageReplyMarkup(saveVibeKeyboard(session.vibes).reply_markup);
  } catch (e) {
    // Ignore "message not modified" errors
  }
}

async function finishSave(ctx, session) {
  try {
    await ctx.reply('💾 Saving\\.\\.\\.', { parse_mode: 'MarkdownV2' });
    const pageId = await saveRestaurant(session.data);
    const notionUrl = `https://notion.so/${pageId.replace(/-/g, '')}`;

    await ctx.reply(
      `✅ *${escapeMd(session.data.name)}* saved\\!\n\n` +
      `📍 ${escapeMd(session.data.region || 'No region')}\n` +
      `💰 ${escapeMd(session.data.priceRange || '—')}\n` +
      `⭐ ${session.data.personalRating || '—'}/10\n\n` +
      `[View in Notion](${notionUrl})`,
      { parse_mode: 'MarkdownV2', disable_web_page_preview: true }
    );
  } catch (err) {
    console.error('/save error:', err.message);
    await ctx.reply('❌ Could not save\\. Please try /save again\\.', { parse_mode: 'MarkdownV2' });
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
