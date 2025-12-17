const sgMail = require('@sendgrid/mail');
const QRCode = require('qrcode');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendConfirmationEmail = async (parentEmail, parentName, showName, seatInfo, confirmationToken, qrCodeData) => {
  try {
    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    const msg = {
      to: parentEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ticketing.com',
      subject: `Ticket Confirmation - ${showName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ticket Confirmation</h2>
          <p>Dear ${parentName},</p>
          <p>Thank you for booking your ticket!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${showName}</h3>
            <p><strong>Seat:</strong> ${seatInfo}</p>
            <p><strong>Confirmation Code:</strong> ${confirmationToken}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Scan this QR code at check-in:</strong></p>
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;">
          </div>

          <p style="color: #666; font-size: 12px;">
            Please bring this email or have the QR code ready when you arrive.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log('Confirmation email sent to', parentEmail);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendLoginEmail = async (parentEmail, loginLink) => {
  try {
    const msg = {
      to: parentEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ticketing.com',
      subject: 'Your Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login to Book Your Ticket</h2>
          <p>Click the link below to log in and select your seat:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Log In Now
            </a>
          </div>

          <p style="color: #666; font-size: 12px;">
            This link expires in 24 hours. If you didn't request this email, you can ignore it.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log('Login email sent to', parentEmail);
    return true;
  } catch (error) {
    console.error('Error sending login email:', error);
    throw error;
  }
};

module.exports = { sendConfirmationEmail, sendLoginEmail };
