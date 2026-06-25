// import nodemailer, { SendMailOptions } from 'nodemailer'




// var transporter = nodemailer.createTransport({
//   host: "live.smtp.mailtrap.io",
//   port: 587,
//   auth: {
//     user: "api",
//     pass: "62b03792555aecd262df97ad76a7814e"
//   }
// });

// // Send mail function
// export const sendMail = async (
//   recipient: string,
//   subject: string,
//   type: 'otp' | 'user',
//   payload: string | { email: string; pass: string }
// ): Promise<void> => {
//   try {
//     console.log(recipient, subject)

//     const htmlContent = getHtmlContent(type, payload)
//     const mailOptions = createMailOptions(recipient, subject, htmlContent)
//     const info = await transporter.sendMail(mailOptions)
//     console.log('✅ Email sent:', info.response)
//   } catch (error) {
//     console.error('❌ Error sending email:', error)
//     throw error
//   }
// }

// // Create mail options
// const createMailOptions = (
//   to: string,
//   subject: string,
//   html: string
// ): SendMailOptions => ({
//   from: '999973001@smtp-brevo.com',
//   to,
//   subject,
//   html,
// })

// // Generate HTML content based on type
// export const getHtmlContent = (
//   type: 'otp' | 'user',
//   payload: string | { email: string; pass: string }
// ): string => {
//   switch (type) {
//     case 'otp':
//       if (typeof payload === 'string') {
//         return generateOtpHtml(payload)
//       } else {
//         throw new Error('Invalid payload for OTP email')
//       }

//     case 'user':
//       if (
//         typeof payload === 'object' &&
//         'email' in payload &&
//         'pass' in payload
//       ) {
//         return generateUserHtml(payload)
//       } else {
//         throw new Error('Invalid payload for User email')
//       }

//     default:
//       throw new Error('Invalid  type')
//   }
// }

// // OTP Email Template
// export const generateOtpHtml = (otp: string): string => `
// <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="UTF-8" />
//     <title>OTP Verification</title>
//     <style>
//       body {
//         font-family: Arial, sans-serif;
//         background-color: #f6f8fa;
//         margin: 0;
//         padding: 0;
//       }
//       .container {
//         background-color: #ffffff;
//         max-width: 600px;
//         margin: 40px auto;
//         padding: 30px;
//         border-radius: 8px;
//         box-shadow: 0 4px 12px rgba(0,0,0,0.05);
//       }
//       .header {
//         text-align: center;
//         margin-bottom: 30px;
//       }
//       .otp {
//         font-size: 28px;
//         font-weight: bold;
//         color: #2c3e50;
//         letter-spacing: 4px;
//         background: #f1f1f1;
//         padding: 12px 20px;
//         display: inline-block;
//         border-radius: 5px;
//       }
//       .footer {
//         margin-top: 40px;
//         font-size: 12px;
//         color: #888;
//         text-align: center;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="header">
//         <h2>Verify Your Email</h2>
//         <p>Please use the following OTP to complete your verification:</p>
//         <div class="otp">${otp}</div>
//       </div>
//       <p style="text-align:center;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
//       <div class="footer">
//         &copy; ${new Date().getFullYear()} Scholar Hub. All rights reserved.
//       </div>
//     </div>
//   </body>
// </html>
// `

// // User Credentials Template
// export const generateUserHtml = (data: {
//   email: string
//   pass: string
// }): string => `
// <!DOCTYPE html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <title>Welcome Email</title>
//     <style>
//       body {
//         font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//         background-color: #f4f6f9;
//         margin: 0;
//         padding: 0;
//       }

//       .email-container {
//         max-width: 600px;
//         margin: 40px auto;
//         background: #ffffff;
//         border-radius: 10px;
//         overflow: hidden;
//         box-shadow: 0 4px 10px rgba(0,0,0,0.05);
//         padding: 30px;
//         color: #333;
//       }

//       .header {
//         text-align: center;
//         margin-bottom: 30px;
//       }

//       .header h1 {
//         color: #007BFF;
//         font-size: 28px;
//       }

//       .content {
//         font-size: 16px;
//         line-height: 1.6;
//       }

//       .label {
//         font-weight: 600;
//         margin-bottom: 5px;
//       }

//       .value {
//         margin-bottom: 20px;
//         font-size: 16px;
//       }

//       .password-box {
//         background-color: #f1f1f1;
//         padding: 12px 16px;
//         border-radius: 8px;
//         display: inline-block;
//         cursor: pointer;
//         font-family: monospace;
//         position: relative;
//         transition: background-color 0.3s;
//       }

//       .password-box:hover {
//         background-color: #e2e6ea;
//       }

//       .password-box .hidden {
//         color: #999;
//         letter-spacing: 5px;
//         transition: all 0.3s;
//       }

//       .password-box:hover .hidden {
//         color: #000;
//         letter-spacing: normal;
//       }

//       .tooltip {
//         visibility: hidden;
//         background-color: #000;
//         color: #fff;
//         text-align: center;
//         border-radius: 4px;
//         padding: 5px 10px;
//         position: absolute;
//         bottom: 130%;
//         left: 50%;
//         transform: translateX(-50%);
//         opacity: 0;
//         font-size: 12px;
//         transition: opacity 0.3s;
//         white-space: nowrap;
//       }

//       .password-box:hover .tooltip {
//         visibility: visible;
//         opacity: 1;
//       }

//       .login-btn {
//         display: inline-block;
//         margin-top: 30px;
//         background-color: #007BFF;
//         color: #fff;
//         padding: 12px 24px;
//         text-decoration: none;
//         border-radius: 6px;
//         font-weight: bold;
//         transition: background-color 0.3s;
//       }

//       .login-btn:hover {
//         background-color: #0056b3;
//       }

//       .footer {
//         margin-top: 40px;
//         font-size: 12px;
//         color: #888;
//         text-align: center;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="email-container">
//       <div class="header">
//         <h1>Welcome to Scholar Hub 🎓</h1>
//         <p>Your account credentials are below</p>
//       </div>

//       <div class="content">
//         <p class="label">Email:</p>
//         <p class="value">${data.email}</p>

//         <p class="label">Password:</p>
//         <div class="password-box" onclick="copyPassword()" title="Click to copy password">
//           <span  class="hidden" id="password">${data.pass}</span>
//           <div class="tooltip">Click to copy</div>
//         </div>

//         <div style="margin-top: 40px; text-align: center;">
//           <a href="https://www.scholarhub.live/login" class="login-btn" target="_blank">Login Now</a>
//         </div>
//       </div>

//       <div class="footer">
//         &copy; ${new Date().getFullYear()} Scholar Hub. All rights reserved.
//       </div>
//     </div>

//     <script>
//       function copyPassword() {
//         const passwordText = document.getElementById('password').textContent;
//         navigator.clipboard.writeText(passwordText).then(() => {
//           alert('🔐 Password copied to clipboard!');
//         });
//       }
//     </script>
//   </body>
// </html>
// `
