// Простая тестовая функция для проверки работы Vercel
export default async function handler(req, res) {
  console.log('🧪 Test simple function called');

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Простой ответ
  res.status(200).json({
    message: 'Test function works!',
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body
  });
}
