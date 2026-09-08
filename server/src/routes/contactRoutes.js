const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

/**
 * Configure Nodemailer transporter using environment credentials
 */
function createTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

/**
 * POST /api/contact
 * Handles incoming portfolio inquiries and forwards them to creator's email via Nodemailer
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, discipline, message, budget } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name.',
      });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide details about your project or inquiry.',
      });
    }

    // Log the contact inquiry for the creator
    const inquiry = {
      timestamp: new Date().toISOString(),
      name: name.trim(),
      email: email.trim(),
      discipline: discipline || 'General Inquiry',
      budget: budget || 'Not specified',
      message: message.trim(),
    };

    console.log('[VENOM INQUIRY RECEIVED]:', inquiry);

    // Forward to creator's email via Nodemailer
    const transporter = createTransporter();
    const recipientEmail =
      process.env.EMAIL_RECEIVER || process.env.EMAIL_USER || 'venom.creative.stu@gmail.com';

    let emailDispatched = false;

    if (transporter) {
      try {
        const mailOptions = {
          from: `"Venom Portfolio Inquiries" <${process.env.EMAIL_USER}>`,
          to: recipientEmail,
          replyTo: `"${inquiry.name}" <${inquiry.email}>`,
          subject: `⚡ [Portfolio Inquiry] ${inquiry.discipline} - from ${inquiry.name}`,
          text: `You have received a new inquiry on your portfolio:

Name: ${inquiry.name}
Email: ${inquiry.email}
Discipline: ${inquiry.discipline}
Budget: ${inquiry.budget}
Date: ${new Date(inquiry.timestamp).toLocaleString()}

Message:
${inquiry.message}

---
You can reply directly to this email to reach ${inquiry.name} (${inquiry.email}).`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #071715; color: #ffffff; border-radius: 12px; border: 1px solid #14b8a6; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 20px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; color: #14b8a6; text-transform: uppercase;">VENOM STUDIOS // TRANSMISSION INCOMING</span>
                <h2 style="margin: 6px 0 0 0; font-size: 22px; color: #ffffff;">New Portfolio Inquiry</h2>
              </div>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; width: 120px;">Client Name:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 15px; font-weight: 700;">${inquiry.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Client Email:</td>
                  <td style="padding: 8px 0; color: #2dd4bf; font-size: 15px; font-weight: 600;">
                    <a href="mailto:${inquiry.email}" style="color: #2dd4bf; text-decoration: none;">${inquiry.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Discipline:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">
                    <span style="background: rgba(20, 184, 166, 0.2); border: 1px solid rgba(20, 184, 166, 0.4); padding: 3px 8px; border-radius: 4px; font-size: 12px; color: #5eead4;">${inquiry.discipline}</span>
                  </td>
                </tr>
                ${inquiry.budget && inquiry.budget !== 'Not specified' ? `
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Budget:</td>
                  <td style="padding: 8px 0; color: #ffffff; font-size: 14px;">${inquiry.budget}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Received At:</td>
                  <td style="padding: 8px 0; color: #cbd5e1; font-size: 13px;">${new Date(inquiry.timestamp).toLocaleString()}</td>
                </tr>
              </table>

              <div style="background: rgba(0, 0, 0, 0.35); border-left: 3px solid #14b8a6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Client Message:</p>
                <p style="margin: 0; color: #f1f5f9; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>
              </div>

              <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 18px;">
                <a href="mailto:${inquiry.email}?subject=${encodeURIComponent('Re: ' + inquiry.discipline + ' Inquiry')}" style="display: inline-block; background: #14b8a6; color: #030d0c; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 999px; text-decoration: none;">
                  Reply Directly to ${inquiry.name} →
                </a>
              </div>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[NODEMAILER] Inquiry notification sent to creator! Message ID:', info.messageId);
        emailDispatched = true;

        // 2. Acknowledgment email to the client / user
        const ackMailOptions = {
          from: `"Venom Studios // Akshat" <${process.env.EMAIL_USER}>`,
          to: `"${inquiry.name}" <${inquiry.email}>`,
          replyTo: recipientEmail,
          subject: `Transmission Received // Venom Studios — Akshat Kushwaha`,
          text: `Hi ${inquiry.name},

Thank you for reaching out through my portfolio.

I have received your inquiry regarding "${inquiry.discipline}". I review incoming client inquiries daily and will get back to you within 24 hours to discuss how we can bring your project to life.

Summary of your transmission:
- Discipline: ${inquiry.discipline}
${inquiry.budget && inquiry.budget !== 'Not specified' ? `- Budget: ${inquiry.budget}\n` : ''}- Message: ${inquiry.message}

If you need urgent assistance, you can also reach me directly on Instagram: @iam__v3nom or reply to this email.

Best regards,
Akshat Kushwaha
Venom Studios | Director, Cinematographer & Editor
Instagram: https://instagram.com/iam__v3nom`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #071715; color: #ffffff; border-radius: 12px; border: 1px solid #14b8a6; padding: 32px 28px; box-shadow: 0 12px 36px rgba(0,0,0,0.6);">
              <!-- Top Branding Header -->
              <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 18px; margin-bottom: 24px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: #14b8a6; text-transform: uppercase;">VENOM STUDIOS // TRANSMISSION CONFIRMED</span>
                <h2 style="margin: 6px 0 0 0; font-size: 24px; color: #ffffff; font-weight: 800; letter-spacing: -0.02em;">We Received Your Message</h2>
              </div>

              <!-- Main Greeting & Message -->
              <p style="font-size: 16px; color: #f1f5f9; line-height: 1.6; margin: 0 0 16px 0;">
                Hello <strong>${inquiry.name}</strong>,
              </p>
              <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for reaching out through my portfolio. Your project transmission has been successfully delivered to my studio desk. I am reviewing your inquiry regarding <strong style="color: #2dd4bf;">${inquiry.discipline}</strong> and will personally get back to you within <strong>24 hours</strong>.
              </p>

              <!-- Transmission Summary Card -->
              <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(20, 184, 166, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 28px;">
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #14b8a6; text-transform: uppercase; display: block; margin-bottom: 12px;">Transmission Summary</span>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; width: 110px;">Discipline:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 14px; font-weight: 600;">${inquiry.discipline}</td>
                  </tr>
                  ${inquiry.budget && inquiry.budget !== 'Not specified' ? `
                  <tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-size: 13px;">Target Budget:</td>
                    <td style="padding: 6px 0; color: #ffffff; font-size: 14px;">${inquiry.budget}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Your Message:</td>
                    <td style="padding: 6px 0; color: #e2e8f0; font-size: 14px; font-style: italic; line-height: 1.5;">"${inquiry.message}"</td>
                  </tr>
                </table>
              </div>

              <!-- Signature & Direct Channels -->
              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #ffffff;">Akshat Kushwaha</p>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #14b8a6; font-weight: 600; letter-spacing: 0.05em;">DIRECTOR • CINEMATOGRAPHER • VIDEO EDITOR</p>
                <p style="margin: 0 0 16px 0; font-size: 12px; color: #94a3b8;">Venom Studios</p>

                <a href="https://instagram.com/iam__v3nom" style="display: inline-block; background: rgba(20, 184, 166, 0.15); border: 1px solid rgba(20, 184, 166, 0.4); color: #5eead4; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 999px; text-decoration: none;">
                  Instagram: @iam__v3nom →
                </a>
              </div>

              <!-- Footer Note -->
              <div style="margin-top: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; color: #64748b;">
                  This is an automated confirmation sent from Venom Portfolio. You can reply directly to this email to follow up.
                </p>
              </div>
            </div>
          `,
        };

        const ackInfo = await transporter.sendMail(ackMailOptions);
        console.log('[NODEMAILER] Acknowledgment email sent to user! Message ID:', ackInfo.messageId);
      } catch (err) {
        console.error('[NODEMAILER ERROR] Failed to send email:', err.message);
      }
    } else {
      console.warn(
        '[NODEMAILER NOTICE] EMAIL_USER or EMAIL_PASS not set in server/.env. Transmission logged to console.'
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Transmission received. Akshat will be in touch within 24 hours.',
      emailDispatched,
      inquirySummary: {
        name: inquiry.name,
        email: inquiry.email,
        discipline: inquiry.discipline,
      },
    });
  } catch (error) {
    console.error('Error processing contact inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing your inquiry. Please reach out directly to venom.creative.stu@gmail.com',
    });
  }
});

module.exports = router;

