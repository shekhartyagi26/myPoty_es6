export default function() {
    const constant = {
        nodeMailer: {
            subject: "Verification Code",
            from: "noreply@fluper.com",
            html: "A verification code has been sent on Email: ",
            text: "Template",
            passwordMessage: 'New Password Generated'
        }
    };
    return constant;
}