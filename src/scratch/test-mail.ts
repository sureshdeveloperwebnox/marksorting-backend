import * as nodemailer from 'nodemailer';

async function testMail() {
  const user = 'sureshdeveloperwebnox@gmail.com';
  const pass = 'azbeavexnqdqrdgz';

  console.log(`Setting up Nodemailer with service: gmail, user: ${user}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Mark Sorting System" <${user}>`,
      to: 'sureshdeveloperwebnox@gmail.com',
      subject: 'SMTP Connection Test - Success',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff6b00; border-radius: 12px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #ff6b00;">SMTP Test Successful!</h2>
          <p>This email verifies that the app password is valid and Gmail SMTP works perfectly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });
    console.log('Email sent successfully!', info.messageId);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

testMail();
