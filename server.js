/**
 * BookOnce backend.
 * Run with: node server.js
 */

import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import aiRouter from './server/routes/ai.js';
import geocodingRouter from './server/routes/geocoding.js';
import routingRouter from './server/routes/routing.js';
import weatherRouter from './server/routes/weather.js';
import agentRouter from './server/routes/agent.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080,http://127.0.0.1:8080')
  .split(',')
  .map(origin => origin.trim());

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '100kb' }));
app.use('/api/ai', aiRouter);
app.use('/api/geocoding', geocodingRouter);
app.use('/api/routing', routingRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/ai/agent', agentRouter);

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, otp } = req.body;
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

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

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending failed');
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BookOnce backend is running' });
});

export { app };

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  app.listen(PORT, () => {
    console.log(`BookOnce backend listening on http://localhost:${PORT}`);
  });
}
