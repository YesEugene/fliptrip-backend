const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development'
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_KEY_HERE');

// Middleware
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API endpoints
app.post('/api/generate-preview', async (req, res) => {
  try {
    const { city, audience, interests, date, budget } = req.body;
    
    // Check if OpenAI API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development') {
      // Use OpenAI to generate creative title and subtitle
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
});

app.post('/api/generate-itinerary', (req, res) => {
  const { city, audience, interests, date, budgetFrom, budgetTo } = req.body;
  
  // Mock itinerary response
  res.json({
    city,
    date,
    meta: {
      creative_title: `Your Perfect Day in ${city}`,
      creative_subtitle: 'A personalized itinerary crafted just for you',
      weather: { t_min: 15, t_max: 25, precip_prob: 20 },
      clothing_advice: 'Comfortable walking shoes and layers'
    },
    daily_plan: [{
      blocks: [{
        time: '09:00',
        items: [{
          title: 'Start your day',
          why: 'Begin your adventure in this beautiful city',
          address: 'City center',
          approx_cost: 'Free',
          tips: 'Take your time to explore'
        }]
      }]
    }]
  });
});

app.post('/api/generate-pdf', (req, res) => {
  res.json({
    message: 'PDF generation will be implemented later',
    pdfBase64: 'mock-pdf-data'
  });
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('Creating checkout session with data:', req.body);
    const { city, audience, interests, budget, date, email } = req.body;
    
    // For development, simulate Stripe checkout
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_STRIPE === 'true') {
      console.log('Using mock Stripe checkout for development');
      const mockSessionId = 'cs_mock_' + Date.now();
      const origin = req.headers.origin || 'http://localhost:5173';
      const mockUrl = `${origin}/success?session_id=${mockSessionId}&city=${encodeURIComponent(city)}&audience=${encodeURIComponent(audience)}&interests=${encodeURIComponent(interests)}&budget=${encodeURIComponent(budget)}&date=${encodeURIComponent(date)}&email=${encodeURIComponent(email)}`;
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      res.json({ sessionId: mockSessionId, url: mockUrl });
      return;
    }
    
    const priceId = process.env.STRIPE_PRICE_ID || 'price_1S3luUIWsHwiGM61Z6teP00a';
    console.log('Using price ID:', priceId);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://surprize-web.vercel.app'}/success?session_id={CHECKOUT_SESSION_ID}&city=${encodeURIComponent(city)}&audience=${encodeURIComponent(audience)}&interests=${encodeURIComponent(interests)}&budget=${encodeURIComponent(budget)}&date=${encodeURIComponent(date)}&email=${encodeURIComponent(email)}`,
      cancel_url: `${req.headers.origin || 'https://surprize-web.vercel.app'}/payment?city=${encodeURIComponent(city)}&audience=${encodeURIComponent(audience)}&interests=${encodeURIComponent(interests)}&budget=${encodeURIComponent(budget)}&date=${encodeURIComponent(date)}&email=${encodeURIComponent(email)}`,
      customer_email: email,
      metadata: {
        city,
        audience,
        interests: Array.isArray(interests) ? interests.join(',') : interests,
        budget,
        date
      }
    });

    console.log('Checkout session created successfully:', session.id);
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.message });
  }
});

// Webhook endpoint for Stripe events
app.post('/api/pay/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_AsXja8Kr11IqWFh7jJcY70iMVlCwSEhV';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment succeeded:', session.id);
      // Here you can add logic to send email, generate itinerary, etc.
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
