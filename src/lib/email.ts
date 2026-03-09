import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "kultureshr@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    const info = await transporter.sendMail({
        from: "Kulture <kultureshr@gmail.com>",
        to,
        subject,
        html,
    });

    console.log("→ Email sent:", info.messageId);

    return info;
}