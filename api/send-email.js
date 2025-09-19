import { Resend } from 'resend';

// Initialize Resend with mock key if no API key is provided
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_development');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, itinerary, formData, pdfUrl } = req.body;

    if (!email || !itinerary || !formData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if we're in development mode or have a mock API key
    if (process.env.NODE_ENV === 'development' || process.env.RESEND_API_KEY === 're_mock_key_for_development') {
      console.log('Mock email sending for development');
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({ success: true, messageId: 'mock_email_' + Date.now() });
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'FlipTrip <onboarding@resend.dev>',
      to: [email],
      subject: `Your ${formData.city} Itinerary is Ready! 🎉`,
      html: generateEmailHTML(itinerary, formData, pdfUrl)
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.json({ success: true, messageId: data.id });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

function generateEmailHTML(itinerary, formData, pdfUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your FlipTrip Itinerary</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8fafc;
          margin: 0;
          padding: 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 20px;
        }
        
        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        
        .badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        
        .content {
          padding: 30px;
        }
        
        .greeting {
          font-size: 1.1rem;
          color: #1f2937;
          margin-bottom: 20px;
        }
        
        .itinerary-preview {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .preview-title {
          font-size: 1.3rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 12px;
        }
        
        .preview-subtitle {
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .preview-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .stat {
          text-align: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }
        
        .stat-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: #3b82f6;
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 1.1rem;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        
        .cta-button:hover {
          transform: translateY(-2px);
        }
        
        .pdf-section {
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        
        .pdf-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }
        
        .pdf-text {
          font-size: 1.1rem;
          color: #1e40af;
          font-weight: 500;
          margin-bottom: 16px;
        }
        
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 0.9rem;
        }
        
        .footer p {
          margin: 0;
        }
        
        .social-links {
          margin-top: 16px;
        }
        
        .social-links a {
          color: #3b82f6;
          text-decoration: none;
          margin: 0 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your ${formData.city} Itinerary is Ready!</h1>
          <p>${itinerary?.meta?.creative_title || `Your Perfect Day in ${formData.city}`}</p>
          
          <div class="badges">
            <div class="badge">🌍 ${formData.city}</div>
            <div class="badge">📅 ${formData.date}</div>
            <div class="badge">For: ${formData.audience}</div>
            <div class="badge">Budget: ${itinerary?.meta?.total_estimated_cost || `${formData.budget}€`}</div>
          </div>
        </div>

        <div class="content">
          <div class="greeting">
            Hi there! 👋<br><br>
            Your personalized ${formData.city} itinerary has been crafted with care, tailored specifically for ${formData.audience === 'him' ? 'him' : formData.audience === 'her' ? 'her' : formData.audience === 'couple' ? 'you both' : 'your family'} and your interests.
          </div>

          <div class="itinerary-preview">
            <div class="preview-title">${itinerary?.meta?.creative_title || `Your Perfect Day in ${formData.city}`}</div>
            <div class="preview-subtitle">${itinerary?.meta?.creative_subtitle || "A personalized itinerary crafted just for you"}</div>
            
            <div class="preview-stats">
              <div class="stat">
                <div class="stat-value">${itinerary?.daily_plan?.[0]?.blocks?.length || 0}</div>
                <div class="stat-label">Activities</div>
              </div>
              <div class="stat">
                <div class="stat-value">${itinerary?.meta?.total_estimated_cost || `${formData.budget}€`}</div>
                <div class="stat-label">Total Budget</div>
              </div>
              <div class="stat">
                <div class="stat-value">${formData.city}</div>
                <div class="stat-label">City</div>
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${pdfUrl || '#'}" class="cta-button">
              📱 View Your Itinerary
            </a>
          </div>

          ${pdfUrl ? `
            <div class="pdf-section">
              <div class="pdf-icon">📄</div>
              <div class="pdf-text">Download your itinerary as a beautiful PDF</div>
              <a href="${pdfUrl}" class="cta-button" style="background: #10b981; margin: 0;">
                📥 Download PDF
              </a>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 12px;">
            <h3 style="color: #1f2937; margin-bottom: 12px;">What's Next?</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>📱 Save this email for easy access to your itinerary</li>
              <li>🗺️ Use the addresses to navigate with Google Maps</li>
              <li>📞 Call ahead to make reservations if needed</li>
              <li>📸 Don't forget to take photos of your amazing day!</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>Created with ❤️ in FlipTrip</p>
          <div class="social-links">
            <a href="#">Website</a> • 
            <a href="#">Support</a> • 
            <a href="#">Unsubscribe</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
