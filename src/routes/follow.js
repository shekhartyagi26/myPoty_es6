import follow from "../controllers/follow";

export default (app) => {

    /* Route for get Follow */
    app.route("/follow/getFollowers/:user_id").get(follow.getFollow);

    /* Route for get Follow */
    app.route("/follow/getFollowing/:user_id").get(follow.getFollowing);

    /* Route for login */
    app.route("/follow/postFollow").post(follow.postFollow);

    /* Route for login */
    app.route("/follow/getOtherUserProfile/:user_id").get(follow.getOtherUserProfile);
    return app;
};