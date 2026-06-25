export const userTemplate = (data: { email: string; pass: string }): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Welcome Email</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
      .email-container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); padding: 30px; color: #333; }
      .header { text-align: center; margin-bottom: 30px; }
      .header h1 { color: #007BFF; font-size: 28px; }
      .content { font-size: 16px; line-height: 1.6; }
      .label { font-weight: 600; margin-bottom: 5px; }
      .value { margin-bottom: 20px; font-size: 16px; }
      .login-btn { display: inline-block; margin-top: 30px; background-color: #007BFF; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; transition: background-color 0.3s; }
      .login-btn:hover { background-color: #0056b3; }
      .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>Welcome to Scholar Hub 🎓</h1>
        <p>Your account credentials are below:</p>
      </div>
      <div class="content">
        <p class="label">Email:</p>
        <p class="value">${data.email}</p>
        <p class="label">Password:</p>
        <p class="value"><b>${data.pass}</b></p>
        <div style="text-align: center;">
          <a href="https://www.scholarhub.live/login" class="login-btn" target="_blank">Login Now</a>
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Scholar Hub. All rights reserved.
      </div>
    </div>
  </body>
</html>`;
