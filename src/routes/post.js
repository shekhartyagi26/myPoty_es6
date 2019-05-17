import post from "../controllers/post";
import auth from "../middleware/auth";
import multer from "multer";
import { STORAGE } from "../modules/image";

export default (app) => {

    app.post('/post', auth.requiresLogin, multer({ storage: STORAGE('post') }).single('file'), post.createPost);

    return app;
};