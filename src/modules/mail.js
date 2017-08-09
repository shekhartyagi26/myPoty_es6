import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import config from "../../config.json";

module.exports = {
    sendMail: function(email, subject, text, from, html) {
        console.log(email, subject, text, from, html)
        return new Promise((resolve, reject) => {
            var mailer = nodemailer.createTransport(smtpTransport({
                host: config.SMTP_HOST,
                port: config.SMTP_PORT,
                auth: {
                    user: config.SMTP_USER,
                    pass: config.SMTP_PASS
                }
            }));
            mailer.sendMail({
                from: from,
                to: email,
                subject: subject,
                template: text,
                html: html
            }, (error, response) => {
                if (error) {
                    reject("Email not send successfully");
                    console.log(error)
                } else {
                    console.log(response)
                    resolve({ message: "Email send successfully" });
                }
                mailer.close();
            });
        })
    }
};