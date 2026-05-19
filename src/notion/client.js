// src/notion/client.js
require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function queryFood({ region, cuisine, priceRange, mealType, hunger, vibeTag, limit = 10 } = {}) {
  const filters = [];

  if (region && region !== 'any') filters.push({ property: 'Region', select: { equals: region } });
  if (cuisine && cuisine !== 'any') filters.push({ property: 'Cuisine Type', multi_select: { contains: cuisine } });
  if (priceRange && priceRange !== 'any') filters.push({ property: 'Price Range', select: { equals: priceRange } });
  if (mealType && mealType !== 'any') filters.push({ property: 'Meal Type', multi_select: { contains: mealType } });
  if (hunger && hunger !== 'any') filters.push({ property: 'Best For Hunger', multi_select: { contains: hunger } });
  if (vibeTag && vibeTag !== 'any') filters.push({ property: 'Vibe Tags', multi_select: { contains: vibeTag } });

  // Always exclude closed
  filters.push({ property: 'Status', select: { does_not_equal: 'Closed' } });

  const query = {
    database_id: DATABASE_ID,
    sorts: [{ property: 'Personal Rating', direction: 'descending' }],
    page_size: Math.min(limit, 100)
  };

  if (filters.length === 1) {
    query.filter = filters[0];
  } else {
    query.filter = { and: filters };
  }

  const response = await notion.databases.query(query);
  return response.results.map(parsePage);
}

async function getRandomFood(region) {
  const filters = [
    { property: 'Would Revisit?', checkbox: { equals: true } },
    { property: 'Status', select: { does_not_equal: 'Closed' } }
  ];
  if (region && region !== 'any') {
    filters.push({ property: 'Region', select: { equals: region } });
  }

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { and: filters },
    page_size: 100
  });

  if (response.results.length === 0) return null;
  const random = response.results[Math.floor(Math.random() * response.results.length)];
  return parsePage(random);
}

async function getTopRated(region, limit = 5) {
  const filters = [
    { property: 'Status', select: { does_not_equal: 'Closed' } }
  ];
  if (region && region !== 'any') {
    filters.push({ property: 'Region', select: { equals: region } });
  }

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: { and: filters },
    sorts: [{ property: 'Personal Rating', direction: 'descending' }],
    page_size: Math.min(limit, 100)
  });

  return response.results.map(parsePage);
}

async function saveRestaurant(data) {
  if (!data.name) throw new Error('Restaurant name is required');

  const props = {
    'Restaurant Name': { title: [{ text: { content: String(data.name).substring(0, 200) } }] },
    'Status': { select: { name: 'Active' } }
  };

  if (data.region) props['Region'] = { select: { name: data.region } };
  if (data.area) props['Specific Area'] = { select: { name: data.area } };
  if (data.address) props['Address'] = { rich_text: [{ text: { content: String(data.address).substring(0, 500) } }] };
  if (data.mapsLink) props['Google Maps Link'] = { url: data.mapsLink };
  if (data.cuisines?.length) props['Cuisine Type'] = { multi_select: data.cuisines.map(c => ({ name: String(c) })) };
  if (data.mealTypes?.length) props['Meal Type'] = { multi_select: data.mealTypes.map(m => ({ name: String(m) })) };
  if (data.priceRange) props['Price Range'] = { select: { name: data.priceRange } };
  if (data.estimatedSpend) props['Estimated Spend Per Pax'] = { number: Number(data.estimatedSpend) };
  if (data.personalRating) props['Personal Rating'] = { number: Number(data.personalRating) };
  if (data.wouldRevisit !== undefined) props['Would Revisit?'] = { checkbox: Boolean(data.wouldRevisit) };
  if (data.hunger?.length) props['Best For Hunger'] = { multi_select: data.hunger.map(h => ({ name: String(h) })) };
  if (data.vibeTags?.length) props['Vibe Tags'] = { multi_select: data.vibeTags.map(v => ({ name: String(v) })) };
  if (data.recommendedDishes) props['Recommended Dishes'] = { rich_text: [{ text: { content: String(data.recommendedDishes).substring(0, 500) } }] };
  if (data.notes) props['Personal Notes'] = { rich_text: [{ text: { content: String(data.notes).substring(0, 2000) } }] };
  if (data.lastVisited) props['Last Visited'] = { date: { start: data.lastVisited } };

  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: props
  });

  return page.id;
}

function parsePage(page) {
  try {
    const p = page.properties;
    const getText = (prop) => prop?.rich_text?.[0]?.plain_text || prop?.title?.[0]?.plain_text || '';
    const getSelect = (prop) => prop?.select?.name || null;
    const getMultiSelect = (prop) => prop?.multi_select?.map(o => o.name) || [];
    const getNumber = (prop) => prop?.number ?? null;
    const getCheckbox = (prop) => prop?.checkbox ?? false;
    const getUrl = (prop) => prop?.url || null;
    const getDate = (prop) => prop?.date?.start || null;

    return {
      id: page.id,
      url: page.url,
      name: getText(p['Restaurant Name']),
      region: getSelect(p['Region']),
      area: getSelect(p['Specific Area']),
      address: getText(p['Address']),
      mapsLink: getUrl(p['Google Maps Link']),
      cuisines: getMultiSelect(p['Cuisine Type']),
      recommendedDishes: getText(p['Recommended Dishes']),
      mealTypes: getMultiSelect(p['Meal Type']),
      priceRange: getSelect(p['Price Range']),
      estimatedSpend: getNumber(p['Estimated Spend Per Pax']),
      googleRating: getNumber(p['Google Maps Rating']),
      personalRating: getNumber(p['Personal Rating']),
      wouldRevisit: getCheckbox(p['Would Revisit?']),
      queueWorthIt: getSelect(p['Queue Worth It?']),
      hunger: getMultiSelect(p['Best For Hunger']),
      vibeTags: getMultiSelect(p['Vibe Tags']),
      notes: getText(p['Personal Notes']),
      lastVisited: getDate(p['Last Visited']),
      status: getSelect(p['Status'])
    };
  } catch (err) {
    console.error('parsePage error:', err.message);
    return { id: page.id, name: 'Unknown', region: null, area: null, cuisines: [], vibeTags: [], hunger: [], mealTypes: [] };
  }
}

module.exports = { queryFood, getRandomFood, getTopRated, saveRestaurant };
