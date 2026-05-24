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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00FFAA;">Здравствуйте!</h2>
        <p>Мы получили запрос на сброс пароля для вашей учётной записи в <strong>BioHub</strong>.</p>
        <p>Если вы инициировали эту процедуру, восстановите доступ по ссылке ниже <strong>(ссылка действительна 30 минут)</strong>:</p>
        <p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; margin: 20px 0; 
                    background-color: #00FFAA; color: #0D1117; text-decoration: none; 
                    border-radius: 6px; font-weight: bold;">
            Восстановить пароль
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          <strong>Важно:</strong> Если вы не запрашивали смену пароля, просто проигнорируйте это письмо. 
          Ваш текущий пароль останется без изменений.
        </p>
        <p style="color: #999; font-size: 13px;">
          Никогда не сообщайте этот код никому. Сотрудники BioHub никогда не попросят вас назвать пароль или код подтверждения.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px;">С уважением,<br/>Команда BioHub</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// import nodemailer from "nodemailer";

// export const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: Number(process.env.EMAIL_PORT),
//   secure: process.env.EMAIL_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendResetPasswordEmail = async (email: string, token: string) => {
//   const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

//   const mailOptions = {
//     from: `"BioHub Support" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Сброс пароля на платформе BioHub",
//     html: `
//       <div style="font-family: sans-serif;">
//         <h2>Здравствуйте!</h2>
//         <p>Вы запросили сброс пароля для вашей учетной записи BioHub.</p>
//         <p>Пожалуйста, нажмите на ссылку ниже, чтобы установить новый пароль. Ссылка действительна в течение 1 часа.</p>
//         <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; margin: 20px 0; background-color: #00FFAA; color: #0D1117; text-decoration: none; border-radius: 5px;">Сбросить пароль</a>
//         <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
//         <hr />
//         <p style="color: #666; font-size: 12px;">С уважением, команда BioHub</p>
//       </div>
//     `,
//   };

//   await transporter.sendMail(mailOptions);
// };
