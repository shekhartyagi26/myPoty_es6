import { BAD_REQUEST_STATUS, SUCCESS_STATUS } from '../constant/status';
import { PROFILE_IMAGE_FORMAT, DELETE_IMAGE } from "../modules/image";
import { successResult, verifyData,serverError } from "../modules/generic";
import BaseAPIController from "./BaseAPIController";
import User from "../models/User.js";
import fs from 'fs';
import mime from "mime";


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
            req.file.profile_picture_format = PROFILE_IMAGE_FORMAT(actualPath)
            updatedDate.profile_picture = req.file;
        }

        User.update(req.User, checkData, updatedDate).then((result) => {
            res.status(SUCCESS_STATUS).json(successResult(result))
        }).catch((e) => {
            DELETE_IMAGE(actualPath);
            res.status(BAD_REQUEST_STATUS).json(serverError(e));
        })
    }
}

const controller = new profileController();
export default controller;