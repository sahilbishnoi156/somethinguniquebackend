const nodemailer = require("nodemailer");

const isDev = process.env.NODE_ENV !== "production";

// Create transporter once (not every call)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send OTP email
 * @param {string} email - Recipient's email
 * @param {string} otp - One-time password
 * @returns {Promise<{ success: boolean, message: string, info?: object }>}
 */
const sendOtp = async (email, otp) => {
  try {
    // Basic validation
    if (!email || !otp) {
      return { success: false, message: "Email and OTP are required." };
    }

    // Verify SMTP connection
    try {
      await transporter.verify();
      if (isDev) console.log("✅ SMTP server is ready to take messages");
    } catch (err) {
      console.error("❌ SMTP verification failed:", err);
      return {
        success: false,
        message: isDev
          ? `SMTP verification failed: ${err.message}`
          : "Email service is currently unavailable. Please try again later.",
      };
    }

    // Send email
    const info = await transporter.sendMail({
      from: '"Professor OTP ✉️" <noreply@somethingunique.edu>',
      to: email,
      subject: `Your Secret Code is Ready! 🚀`,
      text: `Hey there! Your one-time access code is: ${otp}. It’s valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>🚨 Your Secret Access Code 🚨</h1>
          <p>Your exclusive code is:</p>
          <div style="font-size: 28px; font-weight: bold; color: #ff5722; margin: 20px 0;">${otp}</div>
          <p><strong>Expires in 10 minutes. ⏳</strong></p>
        </div>
      `,
    });

    if (isDev) console.log("📧 Email sent successfully:", info);

    return {
      success: true,
      message: "OTP email sent successfully.",
      info: isDev ? info : undefined, // hide SMTP info in prod
    };
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    return {
      success: false,
      message: isDev
        ? `Email sending failed: ${err.message}`
        : "Failed to send OTP. Please try again later.",
    };
  }
};

module.exports = sendOtp;
