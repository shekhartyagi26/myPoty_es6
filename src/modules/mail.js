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
                console.log(error);
                console.log(response);
                // if (error) {
                //      console.log(error)
                //      // res.json({message: "Wrong"});
                //     // resolve("Email not send successfully");
                   
                // } else {
                //     console.log(response)
                //     res.json({message: "send"});
                //     // resolve({ message: "Email send successfully" });
                // }
                // mailer.close();
            });
        })
    }
};