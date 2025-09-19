/**
 * Title Prompts
 * Промпты для генерации заголовков и подзаголовков
 * Изменяйте ТОЛЬКО промпты, не трогайте логику!
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-your-openai-key-here'
});

/**
 * Промпт для генерации заголовка
 * ИЗМЕНЯЙТЕ ТОЛЬКО ЭТОТ ПРОМПТ!
 */
const TITLE_PROMPT = `Write a short and inspiring title in English for a day itinerary. It should contain the city name and reflect the selected interests, be concise and catchy, maximum one sentence.

City: {city}
Interests: {interests}
Audience: {audience}

Examples:
- "Romantic Venice"
- "Adventures in Barcelona" 
- "Cultural Paris"

Create the title:`;

/**
 * Промпт для генерации подзаголовка
 * ИЗМЕНЯЙТЕ ТОЛЬКО ЭТОТ ПРОМПТ!
 */
const SUBTITLE_PROMPT = `Write an inspiring subtitle in English for a day itinerary. Include the date, who the trip is for (for him, for her, for couples, for kids), reflect the selected interests. Describe the day poetically and vividly, so that a person wants to immediately go on this journey. The tone should be emotional but light and elegant.

City: {city}
Date: {date}
Interests: {interests}
Audience: {audience}

Examples:
- "December 25th for her - a romantic journey through the canals of Venice"
- "September 27th for him - adventures in the heart of Catalonia"
- "March 15th for couples - cultural immersion in Paris"

Create the subtitle:`;

/**
 * Генерирует яркий заголовок
 */
async function generateBrightTitle(filterParams) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not set, using fallback title');
    return getFallbackTitle(filterParams);
  }

  try {
    const prompt = TITLE_PROMPT
      .replace('{audience}', filterParams.audience || 'traveler')
      .replace('{city}', filterParams.city || 'Unknown City')
      .replace('{interests}', (filterParams.interests || ['exploration']).join(', '));

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.8
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating title:', error);
    return getFallbackTitle(filterParams);
  }
}

/**
 * Генерирует яркий подзаголовок
 */
async function generateBrightSubtitle(filterParams) {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI API key not set, using fallback subtitle');
    return getFallbackSubtitle(filterParams);
  }

  try {
    const prompt = SUBTITLE_PROMPT
      .replace('{audience}', filterParams.audience || 'traveler')
      .replace('{city}', filterParams.city || 'Unknown City')
      .replace('{interests}', (filterParams.interests || ['exploration']).join(', '));

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating subtitle:', error);
    return getFallbackSubtitle(filterParams);
  }
}

/**
 * Fallback заголовок
 */
function getFallbackTitle(filterParams) {
  const city = filterParams.city || 'Unknown City';
  const audience = filterParams.audience || 'traveler';
  const interests = filterParams.interests || ['exploration'];
  
  // English fallback titles
  const interestNames = {
    'local': 'Local',
    'adventure': 'Adventure',
    'cultural': 'Cultural',
    'romantic': 'Romantic',
    'seasonal': 'Seasonal',
    'festivals': 'Festival'
  };
  
  const interest = interestNames[interests[0]] || interests[0];
  
  return `${interest} ${city}`;
}

/**
 * Fallback подзаголовок
 */
function getFallbackSubtitle(filterParams) {
  const city = filterParams.city || 'Unknown City';
  const audience = filterParams.audience || 'traveler';
  const date = filterParams.date || 'today';
  const interests = filterParams.interests || ['exploration'];
  
  // English fallback subtitles
  const audienceNames = {
    'her': 'for her',
    'him': 'for him', 
    'couple': 'for couples',
    'kids': 'for kids'
  };
  
  const interestNames = {
    'local': 'local',
    'adventure': 'adventure',
    'cultural': 'cultural',
    'romantic': 'romantic',
    'seasonal': 'seasonal',
    'festivals': 'festival'
  };
  
  const audienceText = audienceNames[audience] || audience;
  const interestText = interestNames[interests[0]] || interests[0];
  
  return `${date} ${audienceText} - ${interestText} discoveries in ${city}`;
}

module.exports = {
  generateBrightTitle,
  generateBrightSubtitle
};
