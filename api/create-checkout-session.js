// Vercel Serverless Function для create-checkout-session API
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log('🔍 Payment request received:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  // Устанавливаем CORS заголовки - разрешаем оба домена
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Обрабатываем preflight OPTIONS запрос
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔑 Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasPriceId: !!process.env.STRIPE_PRICE_ID,
      corsOrigin: process.env.CORS_ORIGIN
    });

    // Проверяем обязательные переменные
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ Missing STRIPE_SECRET_KEY');
      return res.status(500).json({ error: 'Stripe configuration missing' });
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.error('❌ Missing STRIPE_PRICE_ID');
      return res.status(500).json({ error: 'Stripe price configuration missing' });
    }

    // Frontend отправляет данные напрямую, не в formData объекте
    const formData = req.body;
    console.log('📝 Form data received:', formData);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `https://fliptrip-frontend.vercel.app/itinerary?city=${formData.city}&audience=${formData.audience}&interests=${Array.isArray(formData.interests) ? formData.interests.join(',') : formData.interests}&date=${formData.date}&budget=${formData.budget}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://fliptrip-frontend.vercel.app/payment`,
      metadata: {
        city: formData.city,
        audience: formData.audience,
        interests: JSON.stringify(formData.interests),
        date: formData.date,
        budget: formData.budget
      }
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};