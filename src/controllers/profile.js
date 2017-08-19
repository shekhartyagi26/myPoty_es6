import BaseAPIController from "./BaseAPIController";
import { successResult, verifyData } from "../modules/generic";
import User from "../models/User.js";
import fs from 'fs';
import mime from "mime";
import { BAD_REQUEST_STATUS, SUCCESS_STATUS } from '../constant/status';


export class profileController extends BaseAPIController {
    get = (req, res) => {
        let user = req.user;
        let result = {};
        result.profile_picture = user.get('profile_picture') && user.get('profile_picture').path || "";
        result.profile_picture_format = user.get('profile_picture') && user.get('profile_picture').profile_picture_format || 0;
        result.user_name = user.get('user_name') || "";
        result.full_name = user.get('full_name') || "";
        result.profession = user.get('profession') || "";
        result.mobile = user.get('mobile') || "";
        result.country_code = user.get('country_code') || "";
        result.dob = user.get('dob') || "";
        result.bio = user.get('bio') || "";
        res.status(SUCCESS_STATUS).json(successResult(result))
    }

    edit = (req, res) => {
        let { access_token } = req.headers;
        let { full_name, profession, dob, bio } = req.body;
        let checkData = { access_token: access_token };
        let updatedDate = {};
        let actualPath = '';
        updatedDate = verifyData({ full_name, profession, dob });
        updatedDate.bio = bio || "";
        if (req.file) {
            actualPath = req.file.path;
            req.file.path = req.file.path.replace('uploads/', "");
            let typeOf = mime.lookup(actualPath);
            req.file.profile_picture_format = typeOf.includes('video') ? 1 : typeOf.includes('image') ? 2 : 0;
            updatedDate.profile_picture = req.file;
        }

        User.update(req.User, checkData, updatedDate).then((result) => {
            res.status(SUCCESS_STATUS).json(successResult(result))
        }).catch((e) => {
            fs.unlink(actualPath, function() {
                res.status(BAD_REQUEST_STATUS).json(serverError(e));
            })
        })
    }
}

const controller = new profileController();
export default controller;