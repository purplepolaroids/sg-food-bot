require('dotenv').config();
const { Telegraf } = require('telegraf');

const { startEat, handleRegion, handlePrice, handleCuisine, handleHunger } = require('./commands/eat');
const { startRandom, handleRandomRegion } = require('./commands/random');
const { startTopRated, handleTopRatedRegion } = require('./commands/toprated');
const { handleCravings } = require('./commands/cravings');
const { startSave, handleSaveText, handleSaveRegion, handleSavePrice, handleSaveCuisine, handleSaveRating, handleSaveRevisit, handleSaveVibe, isInSaveFlow } = require('./commands/save');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.command('start', (ctx) => ctx.reply('🍜 SG Food Bot\n\n/eat — Find somewhere to eat\n/random — Surprise me!\n/toprated — My best picks\n/save — Add a new restaurant\n\nOr just type what you\'re craving.'));
bot.command('eat', startEat);
bot.command('random', startRandom);
bot.command('toprated', startTopRated);
bot.command('save', startSave);
bot.command('cravings', (ctx) => handleCravings(ctx, ctx.message.text.replace(/^\/cravings\S*\s*/i, '').trim()));

bot.action(/^eatregion:(.+)$/, (ctx) => { handleRegion(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^eatprice:(.+)$/, (ctx) => { handlePrice(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^eatcuisine:(.+)$/, (ctx) => { handleCuisine(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^eathunger:(.+)$/, (ctx) => { handleHunger(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^randomregion:(.+)$/, (ctx) => { handleRandomRegion(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^topregion:(.+)$/, (ctx) => { handleTopRatedRegion(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^saveregion:(.+)$/, (ctx) => { handleSaveRegion(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^saveprice:(.+)$/, (ctx) => { handleSavePrice(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^savecuisine:(.+)$/, (ctx) => { handleSaveCuisine(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^rating:(\d+)$/, (ctx) => { handleSaveRating(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^saverevisit:(yes|no)$/, (ctx) => { handleSaveRevisit(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });
bot.action(/^savevibe:(.+)$/, (ctx) => { handleSaveVibe(ctx, ctx.match[1]).catch(console.error); ctx.answerCbQuery().catch(()=>{}); });

bot.on('text', async (ctx) => {
  const text = ctx.message.text?.trim();
  if (!text || text.startsWith('/')) return;
  if (isInSaveFlow(ctx.from.id)) {
    const handled = await handleSaveText(ctx, text).catch(() => false);
    if (handled) return;
  }
  handleCravings(ctx, text).catch(console.error);
});

bot.catch((err) => console.error('Bot error:', err.message));
bot.launch({ dropPendingUpdates: true }).then(() => console.log('🍜 Bot running!')).catch((e) => { console.error(e.message); process.exit(1); });
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
