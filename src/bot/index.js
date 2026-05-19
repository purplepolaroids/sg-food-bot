// src/bot/index.js
require('dotenv').config();
const { Telegraf } = require('telegraf');

const { startEat, handleRegion, handlePrice, handleCuisine, handleHunger } = require('./commands/eat');
const { startRandom, handleRandomRegion } = require('./commands/random');
const { startTopRated, handleTopRatedRegion } = require('./commands/toprated');
const { handleCravings } = require('./commands/cravings');
const {
  startSave, handleSaveText, handleSaveRegion, handleSavePrice,
  handleSaveCuisine, handleSaveRating, handleSaveRevisit,
  handleSaveVibe, isInSaveFlow
} = require('./commands/save');

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set!');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', async (ctx) => {
  await ctx.reply(
    '🍜 SG Food Bot\n\nYour personal Singapore food assistant.\n\n' +
    '/eat — Find somewhere to eat\n' +
    '/random — Surprise me!\n' +
    '/toprated — My best picks\n' +
    '/save — Add a new restaurant\n' +
    '/cravings [text] — Tell me what you feel like\n\n' +
    'Or just type what you\'re craving.'
  );
});

bot.command('eat', startEat);
bot.command('random', startRandom);
bot.command('toprated', startTopRated);
bot.command('save', startSave);

bot.command('cravings', async (ctx) => {
  const text = ctx.message.text.replace(/^\/cravings\S*\s*/i, '').trim();
  await handleCravings(ctx, text);
});

// /eat callbacks
bot.action(/^eatregion:(.+)$/, async (ctx) => {
  try { await handleRegion(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^eatprice:(.+)$/, async (ctx) => {
  try { await handlePrice(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^eatcuisine:(.+)$/, async (ctx) => {
  try { await handleCuisine(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^eathunger:(.+)$/, async (ctx) => {
  try { await handleHunger(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});

// /random callbacks
bot.action(/^randomregion:(.+)$/, async (ctx) => {
  try { await handleRandomRegion(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});

// /toprated callbacks
bot.action(/^topregion:(.+)$/, async (ctx) => {
  try { await handleTopRatedRegion(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});

// /save callbacks
bot.action(/^saveregion:(.+)$/, async (ctx) => {
  try { await handleSaveRegion(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^saveprice:(.+)$/, async (ctx) => {
  try { await handleSavePrice(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^savecuisine:(.+)$/, async (ctx) => {
  try { await handleSaveCuisine(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^rating:(\d+)$/, async (ctx) => {
  try { await handleSaveRating(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^saverevisit:(yes|no)$/, async (ctx) => {
  try { await handleSaveRevisit(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});
bot.action(/^savevibe:(.+)$/, async (ctx) => {
  try { await handleSaveVibe(ctx, ctx.match[1]); } catch (e) { console.error(e.message); }
  await ctx.answerCbQuery().catch(() => {});
});

// Free text
bot.on('text', async (ctx) => {
  const text = ctx.message.text?.trim();
  if (!text || text.startsWith('/')) return;

  if (isInSaveFlow(ctx.f
