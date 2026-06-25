const nodemailer = require('nodemailer');
// Create a transporter object
 const transporter = nodemailer.createTransport({
 host: 'smtp.gmail.com',
 port: 587,
 auth: {
   user: 'shahanas7210@gmail.com',
   pass: 'arkp cvvt fvib odwj'
 },
 debug: true, // Enable debug output
 logger: true // Log information in console
});
// Configure the mail options
  const mailOptions = {
 from: 'shahanas7210@gmail.com',
 to: 'shahanas.dev@gmail.com',
 subject: 'Test Email',
 text: 'This is a test email. hello server'
};
// Send the email
transporter.sendMail(mailOptions, (error, info) => {
 if (error) {
   console.log('Error:', error);
 } else {
   console.log('Email sent:', info.response);
 }
});