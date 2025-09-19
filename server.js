require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const Stripe = require('stripe');
const ItineraryGenerator = require('./services/itineraryGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const itineraryGenerator = new ItineraryGenerator();

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

// Import endpoints
const smartItineraryHandler = require('./api/smart-itinerary');
const smartItineraryV2Handler = require('./api/smart-itinerary-v2');
const creativeItineraryHandler = require('./api/creative-itinerary');
const realPlacesItineraryHandler = require('./api/real-places-itinerary');
const photosRouter = require('./routes/photos');
const generatePdfHandler = require('./api/generate-pdf');
const examplesRouter = require('./api/examples');
const sendEmailHandler = require('./api/send-email');

// API endpoints
app.post('/api/smart-itinerary', smartItineraryHandler);
app.post('/api/smart-itinerary-v2', smartItineraryV2Handler);
app.post('/api/creative-itinerary', creativeItineraryHandler);
app.post('/api/real-places-itinerary', realPlacesItineraryHandler);
app.use('/api/photos', photosRouter);
app.use('/api/examples', examplesRouter);
app.post('/api/generate-pdf', generatePdfHandler);
app.post('/api/send-email', sendEmailHandler);

app.post('/api/generate-preview', async (req, res) => {
  try {
    const { city, audience, interests, date, budget } = req.body;
    console.log('Generating preview for:', { city, audience, interests, date, budget });
    
    const result = await itineraryGenerator.generatePreview(city, audience, interests, date, budget);
    res.json(result);
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate preview',
      title: `Your Perfect Day in ${req.body.city || 'the city'}`,
      subtitle: 'A personalized itinerary crafted just for you.'
    });
  }
});

app.post('/api/generate-itinerary', async (req, res) => {
  try {
    const { city, audience, interests, date, budgetFrom, budgetTo, budget } = req.body;
    console.log('Generating itinerary for:', { city, audience, interests, date, budget });
    
    // Сначала генерируем превью, чтобы получить заголовок и подзаголовок
    const previewData = await itineraryGenerator.generatePreview(city, audience, interests, date, budget);
    console.log('Preview data:', previewData);
    
    // Затем генерируем полный маршрут с использованием данных превью
    const result = await itineraryGenerator.generateItinerary(city, audience, interests, date, budget, previewData);
    console.log('Generated itinerary with', result.daily_plan[0].blocks.length, 'blocks');
    res.json(result);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary',
      city: req.body.city || 'Unknown',
      date: req.body.date || new Date().toISOString().slice(0, 10),
      meta: {
        creative_title: `Идеальный день в ${req.body.city || 'городе'}`,
        creative_subtitle: 'Персонализированный маршрут, созданный специально для тебя'
      },
      daily_plan: [{ blocks: [] }]
    });
  }
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
