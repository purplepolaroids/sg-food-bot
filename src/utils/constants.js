// src/utils/constants.js

const REGIONS = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];

const AREAS = [
  'Tanjong Pagar', 'Bugis', 'Orchard', 'Chinatown', 'Tiong Bahru',
  'Katong', 'Tampines', 'Jurong', 'Woodlands', 'Bedok',
  'Serangoon', 'Bishan', 'Clarke Quay', 'Marina Bay',
  'Dhoby Ghaut', 'Holland Village', 'Clementi', 'Punggol', 'Other'
];

const CUISINES = [
  'Chinese', 'Japanese', 'Korean', 'Western', 'Indian',
  'Malay', 'Thai', 'Vietnamese', 'Italian', 'Mexican',
  'Fusion', 'Singaporean / Local', 'Seafood', 'Vegetarian', 'Dessert', 'Cafe'
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Cafe', 'Dessert'];

const PRICE_RANGES = ['Under $10', '$10–20', '$20–30', '$30–50', '$50–100', '$100+'];

const HUNGER_LEVELS = [
  'Nope not hungry',
  'Just snacking',
  'Slightly hungry',
  'Hungry',
  'Very hungry',
  'Starving',
  'Post-gym monster hunger'
];

const VIBE_TAGS = [
  'Cozy', 'Date night', 'Aesthetic', 'Solo dining',
  'Work-friendly', 'Casual', 'Fancy', 'Hidden gem',
  'Late night', 'Family-friendly'
];

const PRICE_EMOJI = {
  'Under $10':  '💚',
  '$10–20':     '💛',
  '$20–30':     '🟠',
  '$30–50':     '🔴',
  '$50–100':    '💜',
  '$100+':      '💎'
};

const HUNGER_EMOJI = {
  'Nope not hungry':          '😶',
  'Just snacking':            '🍪',
  'Slightly hungry':          '🙂',
  'Hungry':                   '😋',
  'Very hungry':              '😤',
  'Starving':                 '😩',
  'Post-gym monster hunger':  '🏋️'
};

module.exports = {
  REGIONS, AREAS, CUISINES, MEAL_TYPES,
  PRICE_RANGES, HUNGER_LEVELS, VIBE_TAGS,
  PRICE_EMOJI, HUNGER_EMOJI
};
