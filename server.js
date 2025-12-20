/**
 * Simple Express server for sending emails via Gmail
 * Run with: node server.js
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, otp, gmailEmail, gmailPassword } = req.body;

    // Validate inputs
    if (!to || !otp || !gmailEmail || !gmailPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    // Email content
    const mailOptions = {
      from: gmailEmail,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 20px; border-radius: 10px; color: white; text-align: center;">
            <h2 style="margin: 0; font-size: 28px;">BookOnce</h2>
            <p style="margin: 10px 0 0 0;">Email Verification</p>
          </div>
          
          <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
              Your OTP code is:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #6366f1;">
              <h1 style="color: #6366f1; font-size: 48px; letter-spacing: 10px; margin: 0; font-family: monospace;">
                ${otp}
              </h1>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; text-align: center;">
              This code expires in 15 minutes.
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 BookOnce. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent to ${to}`);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Email server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`);
  console.log(`📨 Send emails to: http://localhost:${PORT}/api/send-email`);
});
