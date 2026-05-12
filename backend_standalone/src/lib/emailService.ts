import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"BioHub Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Сброс пароля на платформе BioHub",
    html: `
      <div style="font-family: sans-serif;">
        <h2>Здравствуйте!</h2>
        <p>Вы запросили сброс пароля для вашей учетной записи BioHub.</p>
        <p>Пожалуйста, нажмите на ссылку ниже, чтобы установить новый пароль. Ссылка действительна в течение 1 часа.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #00FFAA; color: #0D1117; text-decoration: none; border-radius: 5px;">Сбросить пароль</a>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">С уважением, команда BioHub</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
