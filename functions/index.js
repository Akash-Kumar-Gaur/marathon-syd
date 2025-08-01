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
    const gmailEmail = process.env.GMAIL_EMAIL || "genaiphotobooth@gmail.com";
    const gmailPassword = process.env.GMAIL_PASSWORD || "uqvysqxoaguujopl";

    mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });
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
    subject: "Your Sydney Marathon OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  };

  await mailTransport.sendMail(mailOptions);

  return { success: true };
});
