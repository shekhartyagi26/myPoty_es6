import { BAD_REQUEST_STATUS, INVALID_ACCESS_TOKEN_STATUS, PARAMETER_MISSING_STATUS } from '../constant/status';
import { successResult, serverError, invalidToken, parameterMissing } from "../modules/generic";

export class AuthController {

    // middleware for logged in users
    requiresLogin(req, res, next) {
        console.log('=================')
        console.log(req.headers)
        console.log('=================')
        let { access_token } = req.headers;

        if (access_token) {
            req.User.findOne({ access_token }, (error, user) => {
                if (error) {
                    next(res.status(BAD_REQUEST_STATUS).json(serverError()));
                } else if (user === null || user.length === 0) {
                    next(res.status(INVALID_ACCESS_TOKEN_STATUS).json(invalidToken()));
                } else {
                    req.user = user;
                    next();
                }
            })
        } else {
            next(res.status(PARAMETER_MISSING_STATUS).json(parameterMissing()));
        }
    }
}

const controller = new AuthController();
export default controller;