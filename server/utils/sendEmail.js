// No real SMTP/email service is configured in this project (.env has no
// mail credentials), so this just logs the email to the server console
// instead of actually sending it. That's enough to test the forgot/reset
// password flow locally — copy the reset link from the terminal.
//
// To send real emails later: install nodemailer, add SMTP_HOST/SMTP_USER/
// SMTP_PASS (etc.) to .env, and replace the body of this function with an
// actual transporter.sendMail(...) call. Everything that calls sendEmail()
// stays the same.
const sendEmail = async ({ to, subject, html }) => {
  console.log("\n========== EMAIL (dev mode — not actually sent) ==========");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(html);
  console.log("============================================================\n");
};

module.exports = sendEmail;