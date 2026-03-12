const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  // If there are no real SMTP credentials in .env, automatically create a test account
  if (!process.env.SMTP_HOST || (process.env.SMTP_HOST === 'smtp.mailtrap.io' && !process.env.SMTP_EMAIL)) {
    console.log('No SMTP credentials found. Automatically creating a test Ethereal email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } else {
    // Create a transporter using real .env credentials
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 2525,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Define the email options
  const message = {
    from: `${process.env.FROM_NAME || 'TaskBoard'} <${process.env.FROM_EMAIL || 'noreply@taskboard.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);

  // If using ethereal, output the clickable preview URL to the terminal
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n======================================================');
    console.log(' TEST EMAIL SENT SUCESSFULLY - PREVIEW IT HERE:');
    console.log(` -> ${previewUrl}`);
    console.log('======================================================\n');
  }
};

module.exports = sendEmail;
