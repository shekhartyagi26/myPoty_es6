import BaseAPIController from "./BaseAPIController";
import { successResponse, serverError } from "../modules/generic";
import { SUCCESS, ERROR } from "../modules/constant";
var fs = require('fs')
import mime from "mime";

export class ImageController extends BaseAPIController {
    profileImage = (req, res) => {
        let UserModel = req.User;
        let { access_token } = req.headers;
        if (access_token && req.file) {
            let path_name = req.file.originalname
            let type = req.file.mimetype
            let data = { "access_token": access_token };
            let actualPath = req.file.path;
            req.file.path = req.file.path.replace('uploads/', "");
            let typeOf = mime.lookup(actualPath);
            req.file.profile_picture_format = typeOf.includes('video') ? 1 : typeOf.includes('image') ? 2 : 0;
            UserModel.findOneAndUpdate(data, { $set: { profile_picture: req.file, status: 3 }, returnNewDocument: true, upsert: true }, (err, insertData) => {
                if (err) {
                    fs.unlink(actualPath, function() {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, err, 'Error.'));
                    })
                } else {
                    if (insertData) {
                        res.status(SUCCESS);
                        data.file = req.file;
                        data.status = 3;
                        res.json(successResponse(SUCCESS, data, 'Image Upload Successfully.'));
                    } else {
                        fs.unlink(actualPath, function() {
                            res.status(ERROR)
                            res.json(successResponse(ERROR, {}, 'Invalid Token.'));
                        })
                    }
                }
            });
        } else {
            if (req.file) {
                fs.unlink(actualPath, function() {
                    res.status(ERROR)
                    res.json(successResponse(ERROR, {}, 'Invalid Token.'));
                })
            } else {
                res.status(ERROR)
                res.json(successResponse(ERROR, {}, 'Please Attach Image or Video.'));
            }
        }
    }
}

const controller = new ImageController();
export default controller;