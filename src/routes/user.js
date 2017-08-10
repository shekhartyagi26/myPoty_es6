import user from "../controllers/user";

export default (app) => {

    /* Route for login */
    app.route("/user/login").post(user.login);

    /* Route for create Account */
    app.route("/user/signUp").post(user.signUp);

    /* Route for Social login and create */
    app.route("/user/socialLogin").post(user.socialLogin);

    /* Route for verify OTP */
    app.route("/user/verifyCode").post(user.verifyCode);

    /* Route for forgot Password */
    app.route("/user/forgotPassword").post(user.forgotPassword);

    /* Route for create UserName */
    app.route("/user/createUserName").post(user.createUserName);

    /* Route for save Personal Details */
    app.route("/user/savePersonalDetails").post(user.savePersonalDetails);

    /* Route for save Personal Details */
    app.route("/user/getInterests").get(user.intrestingTopics);

    /* Route for save Personal Details */
    app.route("/user/saveInterest").post(user.saveInterest);

    /* Route for logout */
    app.route("/user/resetPassword").post(user.resetPassword);

    /* Route for logout */
    app.route("/user/logout").post(user.logout);

    /* Route for logout */
    app.route("/user/getOtherUsers").post(user.getOtherUsers);

    /* Route for change Mobile */
    app.route("/user/changeMobile").post(user.changeMobile);

    return app;
};