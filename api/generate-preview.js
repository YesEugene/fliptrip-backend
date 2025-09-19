const OpenAI = require('openai');

export const config = { runtime: 'nodejs' };

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://fliptrip-web.vercel.app",
  "https://surprize-web.vercel.app"
];

function setCors(res, origin) {
  // Allow all origins for now to fix CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { city, audience, interests, date, budget } = req.body;
    
    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development') {
      // Use OpenAI to generate creative title and subtitle
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const prompt = `Generate a compelling and emotional title and subtitle for a personalized day itinerary in ${city}.
The itinerary is for "${audience}" with interests in "${interests.join(', ')}".
The date is ${date} and budget is ${budget}€.

The title should be catchy and reflect the city and interests.
The subtitle should be an emotional description that captures the essence of the day.

Output format as JSON:
{
  "title": "Compelling Title Here",
  "subtitle": "Emotional and vivid subtitle here."
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      });

      const responseContent = completion.choices[0].message.content;
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseContent);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        parsedResponse = {
          title: `Your Perfect Day in ${city}`,
          subtitle: "A personalized itinerary crafted just for you."
        };
      }

      res.json(parsedResponse);
    } else {
      // Fallback to mock response
      const mockTitles = {
        'Paris': {
          'him': 'Parisian Gentleman\'s Day',
          'her': 'Romantic Parisian Dreams',
          'couples': 'Love in the City of Light',
          'kids': 'Magical Paris Adventure'
        },
        'Moscow': {
          'him': 'Moscow Adventure Explorer',
          'her': 'Elegant Moscow Experience',
          'couples': 'Romantic Moscow Journey',
          'kids': 'Fun Moscow Discovery'
        }
      };
      
      const mockSubtitles = {
        'him': `A sophisticated day exploring the best of ${city}`,
        'her': `An enchanting journey through ${city}'s most romantic spots`,
        'couples': `A perfect day for two in the most romantic city`,
        'kids': `A fun-filled family adventure in the magical city`
      };
      
      const title = mockTitles[city]?.[audience] || `${city} on Two Wheels & a Coffee Steam`;
      const subtitle = mockSubtitles[audience] || `Утро с ароматным эспрессо в старом квартале, лёгкий ритм велопрогулки вдоль моря и вечер с бокалом вина — день, где ${city} раскрывается с её уютной и живой стороны.`;
      
      res.json({
        title,
        subtitle
      });
    }
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      title: `Your Perfect Day in ${req.body.city || 'the city'}`,
      subtitle: 'A personalized itinerary crafted just for you.'
    });
  }
}