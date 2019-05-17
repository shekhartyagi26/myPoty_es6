import profile from "../controllers/profile";
import auth from "../middleware/auth";
import multer from "multer";
import { STORAGE } from "../modules/image";

export default (app) => {
    /*Route for edit profile*/
    app.post('/editProfile', auth.requiresLogin, multer({ storage: STORAGE('profile') }).single('file'), profile.edit)

    /* Route for get profile */
    app.route("/profile").post(auth.requiresLogin, profile.get);

    return app;
};