import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config();

console.log("MAIL_HOST:", process.env.MAIL_HOST);
console.log("MAIL_PORT:", process.env.MAIL_PORT);
console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASS:", process.env.MAIL_PASS ? "*****" : undefined);


export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure:Number(process.env.MAIL_PORT)===465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // if using self-signed certs
  },
  connectionTimeout: 10000 // 10s timeout
}

);

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mail server not ready:", error);
  } else {
    console.log("✅ Mail server ready to send messages");
  }
});
