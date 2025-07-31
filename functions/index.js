const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// NOTE: mailTransport is now initialized inside the function
// to ensure config is loaded.
let mailTransport;

exports.sendOtpEmail = functions.https.onCall(async (data, context) => {
  // Lazy initialization of mailTransport
  if (!mailTransport) {
    const gmailEmail = functions.config().gmail.email;
    const gmailPassword = functions.config().gmail.password;

    mailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailEmail,
        pass: gmailPassword,
      },
    });
  }

  const { email, userId } = data;
  if (!email || !userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and userId are required."
    );
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
    from: `Sydney Marathon <${functions.config().gmail.email}>`,
    to: email,
    subject: "Your Sydney Marathon OTP Code",
    text: `Your OTP code is: ${otp}`,
    html: `<p>Your OTP code is: <strong>${otp}</strong></p>`,
  };

  await mailTransport.sendMail(mailOptions);

  return { success: true };
});
