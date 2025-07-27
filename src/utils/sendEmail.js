


import nodemailer from "nodemailer";

const sendEmail = async (
    {
        to = "",
        subject = "no-reply",
        message = "<h1>no message</h1>",
        attachments = []
    }
) => {
    const transporter = nodemailer.createTransport({
        host: "localhost",
        service: "gmail",
        port: 587,
        auth: {
            user: process.env.EMAIL ,
            pass: process.env.EMAIL_PASSWORD 
        }
    });

    const info = await transporter.sendMail({
        from: `"smsm" <${process.env.EMAIL}>`,
        to,
        subject,
        html: message,
        attachments
    });

    return info.accepted.length ? true : false;
};

export default sendEmail;
