// src/ai/parseIntent.js
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a Singapore food recommendation assistant.
Parse user messages into structured search filters for a personal food database.

Singapore context:
- Regions: North, South, East, West, Central, Northeast
- Common areas map to regions: Tanjong Pagar/Chinatown/Tiong Bahru/Orchard = Central, Katong/Tampines/Bedok = East, Jurong/Clementi = West, Woodlands = North, Serangoon/Punggol/Bishan = Northeast
- Cuisines: Chinese, Japanese, Korean, Western, Indian, Malay, Thai, Vietnamese, Italian, Mexican, Fusion, Singaporean / Local, Seafood, Vegetarian, Dessert, Cafe
- Price ranges: Under $10, $10–20, $20–30, $30–50, $50–100, $100+
- Meal types: Breakfast, Lunch, Dinner, Supper, Cafe, Dessert
- Hunger: "Just snacking"=light food, "Slightly hungry"=small meal, "Hungry"=proper meal, "Very hungry"=generous portion, "Starving"=serious food, "Post-gym monster hunger"=maximum food
- Vibes: Cozy, Date night, Aesthetic, Solo dining, Work-friendly, Casual, Fancy, Hidden gem, Late night, Family-friendly

Interpret natural language loosely:
- "cheap" = Under $10 or $10–20
- "supper" / "late night" = meal_type Supper + vibe Late night  
- "aesthetic cafe" = cuisine Cafe + vibe Aesthetic
- "date" = vibe Date night
- "work" / "laptop" = vibe Work-friendly
- "ramen" / "sushi" = cuisine Japanese
- "bak kut teh" / "hawker" / "local" = cuisine Singaporean / Local
- "dim sum" / "wonton" = cuisine Chinese

Always use "any" for fields you cannot determine.`;

const PARSE_FOOD_INTENT = {
  name: 'parse_food_intent',
  description: 'Extract food search filters from user message',
  parameters: {
    type: 'object',
    properties: {
      region: {
        type: 'string',
        enum: ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'any'],
        description: 'Singapore region'
      },
      cuisine: {
        type: 'string',
        description: 'Single cuisine type, or "any"'
      },
      priceRange: {
        type: 'string',
        enum: ['Under $10', '$10–20', '$20–30', '$30–50', '$50–100', '$100+', 'any'],
        description: 'Price range per pax'
      },
      mealType: {
        type: 'string',
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Cafe', 'Dessert', 'any'],
        description: 'Type of meal'
      },
      hunger: {
        type: 'string',
        enum: ['Nope not hungry', 'Just snacking', 'Slightly hungry', 'Hungry', 'Very hungry', 'Starving', 'Post-gym monster hunger', 'any'],
        description: 'Hunger level'
      },
      vibeTag: {
        type: 'string',
        description: 'Single vibe tag, or "any"'
      },
      summary: {
        type: 'string',
        description: 'One-line human-readable summary of what you understood (e.g. "cheap Japanese supper near Central")'
      }
    },
    required: ['region', 'cuisine', 'priceRange', 'mealType', 'hunger', 'vibeTag', 'summary']
  }
};

async function parseIntent(userMessage) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      tools: [{ type: 'function', function: PARSE_FOOD_INTENT }],
      tool_choice: { type: 'function', function: { name: 'parse_food_intent' } },
      temperature: 0.3
    });

    const toolCall = response.choices[0].message.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call returned');
    return JSON.parse(toolCall.function.arguments);
  } catch (err) {
    console.error('OpenAI parse error:', err.message);
    // Fallback: return all-any filters
    return {
      region: 'any', cuisine: 'any', priceRange: 'any',
      mealType: 'any', hunger: 'any', vibeTag: 'any',
      summary: 'anything goes'
    };
  }
}

/**
 * Score results by relevance beyond what Notion filters already handle.
 */
function scoreResults(places, intent) {
  return places.map(place => {
    let score = (place.personalRating || 0) * 10;

    // Vibe match bonus
    if (intent.vibeTag && intent.vibeTag !== 'any') {
      if (place.vibeTags.includes(intent.vibeTag)) score += 15;
    }

    // Would revisit bonus
    if (place.wouldRevisit) score += 10;

    // Recency — slightly penalise if not visited in a long time
    if (place.lastVisited) {
      const daysSince = Math.floor((Date.now() - new Date(place.lastVisited)) / 86400000);
      if (daysSince > 180) score -= 5;
      if (daysSince < 30) score += 3;
    }

    return { ...place, score };
  }).sort((a, b) => b.score - a.score);
}

module.exports = { parseIntent, scoreResults };
