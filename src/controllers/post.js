import { PROFILE_IMAGE_FORMAT, DELETE_IMAGE } from "../modules/image";
import { successResponse, serverError } from "../modules/generic";
import { BAD_REQUEST_STATUS } from '../constant/status';
import { SUCCESS, ERROR } from "../modules/constant";
import BaseAPIController from "./BaseAPIController";

export class postController extends BaseAPIController {
    createPost = (req, res) => {
        console.log(req.file.path)

        // res.status(BAD_REQUEST_STATUS).json(serverError('e'));
        // console.log('hellooooooooooo',req.file)
        // console.log(PROFILE_IMAGE_FORMAT(req.file.filename))

    }
}

const controller = new postController();
export default controller;