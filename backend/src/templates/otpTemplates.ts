export const otpTemplate = (otp: string): string => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
    <style>
      body { font-family: Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 0; }
      .container { background-color: #ffffff; max-width: 600px; margin: 40px auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .otp { font-size: 28px; font-weight: bold; color: #2c3e50; letter-spacing: 4px; background: #f1f1f1; padding: 12px 20px; display: inline-block; border-radius: 5px; }
      .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Verify Your Email</h2>
      <p>Please use the following OTP to complete your verification:</p>
      <div class="otp">${otp}</div>
      <p style="text-align:center;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      <div class="footer">&copy; ${new Date().getFullYear()} Scholar Hub. All rights reserved.</div>
    </div>
  </body>
</html>`;
