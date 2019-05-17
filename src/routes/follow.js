import follow from "../controllers/follow";

export default (app) => {

    /* Route for get Follow */
    app.route("/follow/getFollowers/:user_id").get(follow.getFollow);

    /* Route for get Following */
    app.route("/follow/getFollowing/:user_id").get(follow.getFollowing);

    /* Route for create follow */
    app.route("/follow/postFollow").post(follow.postFollow);

    /* Route for get other User profile with respect to follow */
    app.route("/follow/getOtherUserProfile/:user_id").get(follow.getOtherUserProfile);
    return app;
};