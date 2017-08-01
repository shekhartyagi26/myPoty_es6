import user from "../controllers/user";

export default (app) => {
    /* Route for User Register  */
    // app.route("/user/create").post(user.create);

    /* Route for login */
    // app.route("/user/login").post(user.login);

    /* Route for create Account */
    app.route("/user/signUp").post(user.signUp);

    // /* Route for Social login and create */
    // app.route("/user/socialLogin").post(user.socialLogin);

    // /* Route for forgot Password */
    // app.route("/user/forgot_password").post(user.forgot_password);

    /* Route for verify OTP */
    app.route("/user/verifyCode").post(user.verifyCode);

    // /* Route for Resend OTP */
    // app.route("/user/resendOTP").post(user.resendOTP);

    // /* Route for create UserName */
    // app.route("/user/createUserName").post(user.createUserName);

    return app;
};