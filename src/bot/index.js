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
const { escapeMd } = require('../formatters/card');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ─── Commands ────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  await ctx.reply(
    '🍜 *SG Food Bot*\n\nYour personal Singapore food assistant\\.\n\n' +
    '*/eat* — Find somewhere to eat\n' +
    '*/random* — Surprise me\\!\n' +
    '*/toprated* — My best picks\n' +
    '*/save* — Add a new restaurant\n' +
    '*/cravings* \\[text\\] — Tell me what you feel like\n\n' +
    'Or just type what you\'re craving\\.',
    { parse_mode: 'MarkdownV2' }
  );
});

bot.command('eat', startEat);
bot.command('random', startRandom);
bot.command('toprated', startTopRated);
bot.command('save', startSave);

bot.command('cravings', async (ctx) => {
  const text = ctx.message.text.replace('/cravings', '').trim();
  if (!text) {
    await ctx.reply(
      '💬 Tell me what you\'re craving\\!\n\nExamples:\n• _I want ramen_\n• _cheap supper near Central_\n• _aesthetic cafe to work at_\n• _starving, something hearty_',
      { parse_mode: 'MarkdownV2' }
    );
    return;
  }
  await handleCravings(ctx, text);
});

// ─── /eat callbacks ──────────────────────────────────────────────────────────

bot.action(/^eatregion:(.+)$/, async (ctx) => {
  await handleRegion(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^eatprice:(.+)$/, async (ctx) => {
  await handlePrice(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^eatcuisine:(.+)$/, async (ctx) => {
  await handleCuisine(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^eathunger:(.+)$/, async (ctx) => {
  await handleHunger(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

// ─── /random callbacks ───────────────────────────────────────────────────────

bot.action(/^randomregion:(.+)$/, async (ctx) => {
  await handleRandomRegion(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

// ─── /toprated callbacks ─────────────────────────────────────────────────────

bot.action(/^topregion:(.+)$/, async (ctx) => {
  await handleTopRatedRegion(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

// ─── /save callbacks ─────────────────────────────────────────────────────────

bot.action(/^saveregion:(.+)$/, async (ctx) => {
  await handleSaveRegion(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^saveprice:(.+)$/, async (ctx) => {
  await handleSavePrice(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^savecuisine:(.+)$/, async (ctx) => {
  await handleSaveCuisine(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^rating:(\d+)$/, async (ctx) => {
  await handleSaveRating(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^saverevisit:(yes|no)$/, async (ctx) => {
  await handleSaveRevisit(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

bot.action(/^savevibe:(.+)$/, async (ctx) => {
  await handleSaveVibe(ctx, ctx.match[1]);
  await ctx.answerCbQuery();
});

// ─── Free text ───────────────────────────────────────────────────────────────

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();

  if (isInSaveFlow(ctx.from.id)) {
    const handled = await handleSaveText(ctx, text);
    if (handled) return;
  }

  if (!text.startsWith('/')) {
    await handleCravings(ctx, text);
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────

bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}:`, err);
});

// ─── Start ────────────────────────────────────────────────────────────────────

bot.launch().then(() => {
  console.log('🍜 SG Food Bot is running...');
}).catch(err => {
  console.error('Failed to launch bot:', err);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
