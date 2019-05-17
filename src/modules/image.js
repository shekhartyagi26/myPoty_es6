import mkdirp from "mkdirp";
import multer from "multer";
import path from "path";
import mime from "mime";
import fs from "fs";
import { BAD_REQUEST_STATUS } from '../constant/status';

// image path for uploading image
const STORAGE = (uploadPath = '') => {
    return multer.diskStorage({
        destination: function(req, file, callback) {
            let dest = `uploads/${uploadPath}`;
            mkdirp.sync(dest);
            callback(null, dest);
        },
        filename: function(req, file, callback) {
            var fileUniquename = Date.now();
            callback(null, fileUniquename + path.extname(file.originalname));
        }
    });
}

//get profile picture format 1 for video and 2 for image
const PROFILE_IMAGE_FORMAT = (path = '') => {
    // PROFILE_IMAGE_FORMAT(req.file.filename)
    let typeOf = mime.lookup(path);
    return typeOf.includes('video') ? 1 : typeOf.includes('image') ? 2 : 0;
}

//remove the image from system
const DELETE_IMAGE = (path) => {
    // DELETE_IMAGE(req.file.path);
    fs.unlink(path, function() {
        return;
    })
}

module.exports = {
    STORAGE,
    PROFILE_IMAGE_FORMAT,
    DELETE_IMAGE
};