import profile from "../controllers/profile";
import auth from "../middleware/auth";
import mkdirp from "mkdirp";
import multer from "multer";
import path from "path";

export default (app) => {
    var storage = multer.diskStorage({
        destination: function(req, file, callback) {
            let dest = 'uploads/profile';
            mkdirp.sync(dest);
            callback(null, dest);

        },
        filename: function(req, file, callback) {
            var fileUniquename = Date.now();
            callback(null, fileUniquename + path.extname(file.originalname));
        }
    });
    var upload = multer({ storage: storage });
    app.post('/editProfile', auth.requiresLogin, upload.single('file'), profile.edit)

    /* Route for get profile */
    app.route("/profile").post(auth.requiresLogin, profile.get);

    return app;
};