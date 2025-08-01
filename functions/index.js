const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// NOTE: mailTransport is now initialized inside the function
// to ensure config is loaded.
let mailTransport;

exports.sendOtpEmail = onCall(async (request) => {
  // Lazy initialization of mailTransport
  if (!mailTransport) {
    const gmailEmail =
      process.env.GMAIL_EMAIL || "treasurehuntgame2025@gmail.com";
    const gmailPassword = process.env.GMAIL_PASSWORD || "awdzpdqcmjunzlgq";

    console.log("Initializing mail transport with email:", gmailEmail);

    mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });

    // Verify the connection
    try {
      await mailTransport.verify();
      console.log("Mail transport verified successfully");
    } catch (error) {
      console.error("Mail transport verification failed:", error);
      throw new Error(`Email configuration error: ${error.message}`);
    }
  }

  const { email, userId } = request.data;
  if (!email || !userId) {
    throw new Error("Email and userId are required.");
  }

  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to Firestore
  await admin.firestore().collection("users").doc(userId).update({
    otp,
    otpCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Compose and send email
  const mailOptions = {
    from: `Sydney Marathon <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: "Sydney Marathon 2025 Treasure Hunt One-Time Password",
    text: `
  Hello,
  
  You're about to take part in the Sydney Marathon 2025 Treasure Hunt Game — where exciting deals and hidden surprises await you around every corner.
  
  To begin your journey, use the OTP below to access the game portal:
  
  Your One-Time Password: ${otp}
  
  Gear up, explore, and uncover special offers as you race your way through this interactive experience.
  
  Let the hunt begin!
  
  See you at the finish line,
  Sydney Marathon Team
    `,
    html: `
      <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Sydney Marathon 2025 Treasure Hunt</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #081F2D; padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 26px;">Sydney Marathon 2025</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; color: #333333;">
                    <p style="font-size: 16px; margin-bottom: 20px;">
                      Hello,
                    </p>
                    <p style="font-size: 16px; line-height: 1.5;">
                      You're about to take part in the <strong>Sydney Marathon 2025 Treasure Hunt Game</strong> —
                      where exciting deals and hidden surprises await you around every corner.
                    </p>
                    <p style="font-size: 16px; line-height: 1.5;">
                      To begin your journey, use the OTP below to access the game portal:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <p style="font-size: 18px; margin-bottom: 10px;">Your One-Time Password</p>
                      <div style="font-size: 32px; font-weight: bold; color: #081F2D; letter-spacing: 4px; padding: 10px 20px; border: 2px dashed #081F2D; display: inline-block; border-radius: 8px;">
                        ${otp}
                      </div>
                    </div>
                    <p style="font-size: 16px; line-height: 1.5;">
                      Gear up, explore, and uncover special offers as you race your way through this interactive experience.
                      <strong>Let the hunt begin!</strong>
                    </p>
                    <p style="font-size: 16px; margin-top: 30px;">See you at the finish line,</p>
                    <p style="font-size: 16px; font-weight: bold; color: #081F2D;">Sydney Marathon Team</p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f2f2f2; text-align: center; padding: 20px; font-size: 12px; color: #777;">
                    © 2025 Sydney Marathon. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `,
  };

  try {
    await mailTransport.sendMail(mailOptions);
    console.log("Email sent successfully to:", email);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
});
