import BaseAPIController from "./BaseAPIController";
import User from "../models/User.js";
import Topics from "../models/IntrestingTopics.js";
import generatePassword from 'password-generator';
import config from "../../config.json";
import { successResult, verifyData, encodePassword, serverError, mergeArray, countryCode, generateRandomString, validate, parameterMissing } from "../modules/generic";
import twilio from "../modules/twilio";
import mail from "../modules/mail";
import constant from "../models/constant";
import { encodeToken } from "../modules/token";
import async from "async";
import _ from "lodash";
import { PARAMETER_MISSING_STATUS, BAD_REQUEST_STATUS, ALREADY_EXIST, SUCCESS_STATUS } from '../constant/status';
import { USERNAME_EXIST, INVALID_ARRAY, INVALID_LOGIN_MESSAGE, USER_EXIST, LOGIN_SUCCESSFULLY_MESSAGE, MOBILE_NUMBER_MESSAGE, OTP_MATCHED, INVALID_VERIFICATION_CODE, USER_LOGOUT_MESSAGE, PASSWORD_CHANGE_MESSAGE, INVALID_MOBILE_EMAIL, OTP_SENT, VERIFICATION_MESSAGE } from '../constant/message';

export class UserController extends BaseAPIController {

    /* Controller for User Login  */
    login = (req, res) => {
        let { email, mobile, password } = req.body;
        let data = {};
        if (mobile && password) {
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing());
            return;
        }
        let UserModel = req.User;
        data.password = encodePassword(password);
        User.findOne(UserModel, data).then((user) => {
            if (user) {
                let access_token = encodeToken(user._id)
                User.update(UserModel, data, { access_token }).then((result) => {
                    res.status(SUCCESS_STATUS).json(successResult(result, LOGIN_SUCCESSFULLY_MESSAGE))
                }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
            } else {
                res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(INVALID_LOGIN_MESSAGE));
            }
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
    }

    /*Controller for manual signup*/
    signUp = (req, res) => {
        let user_details = req.body.user;
        let UserModel = req.User;
        if (!user_details) {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        let data = {};
        let { mobile, email, password, country_code } = req.body.user
        if (mobile && password && country_code) {
            country_code = countryCode(country_code);
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        User.findOne(UserModel, data)
            .then((user) => {
                if (user) {
                    res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(USER_EXIST))
                } else {
                    user_details.password = encodePassword(password)
                    user_details.created_on = new Date();
                    user_details.timeStamp = new Date().getTime();
                    user_details.is_verify = 0;
                    user_details.is_deleted = 0;
                    user_details.is_blocked = 0;
                    user_details.modified_on = new Date();
                    user_details.status = 1;
                    User.save(UserModel, user_details)
                        .then((userData) => {
                            let verification_code = generateRandomString();
                            // let verification_code = 123456;
                            let updatedData = { verification_code: verification_code }
                            let access_token = encodeToken(userData._id);;
                            updatedData.access_token = access_token;
                            let dbql = mobile ? twilio.sendMessageTwilio(VERIFICATION_MESSAGE + verification_code, country_code + mobile) : mail.sendMail(email, constant().nodeMailer.subject, constant().nodeMailer.text, config.nodeMailer_email, constant().nodeMailer.html + verification_code);
                            dbql.then((result) => {
                                User.update(UserModel, data, updatedData).then((result) => {
                                    let sentData = { access_token, status: 1 };
                                    mobile ? sentData.mobile = mobile : sentData.email = email;
                                    res.status(SUCCESS_STATUS).json(successResult(sentData, OTP_SENT))
                                }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                }
            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
    }

    /*Controller for social Login and social signup*/
    socialLogin = (req, res) => {
        let body = req.body;
        let user = body.user;
        const UserModel = req.User;
        if (!user || !user.fb_id) {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        let fb_id = user.fb_id;

        User.findOne(UserModel, { fb_id }).then((user_details) => {
            if (user_details) {
                let access_token = encodeToken(user_details._id)
                User.update(UserModel, { fb_id }, { access_token }).then((result) => {
                    res.status(SUCCESS_STATUS).json(successResult(result, LOGIN_SUCCESSFULLY_MESSAGE))
                }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
            } else {
                user = verifyData(user);
                user.password = generatePassword(6);
                user.created_on = new Date();
                user.timeStamp = new Date().getTime();
                user.is_verify = 0;
                user.is_deleted = 0;
                user.is_blocked = 0;
                user.modified_on = new Date();
                user.status = 2;
                User.save(UserModel, user).then((result) => {
                    let access_token = encodeToken(userData._id)
                    User.update(UserModel, { fb_id }, { access_token }).then((result) => {
                        res.status(SUCCESS_STATUS).json(successResult(result, LOGIN_SUCCESSFULLY_MESSAGE))
                    }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
            }
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
    }

    /*Controller for verify verification code*/
    verifyCode = (req, res) => {
        let { mobile, email, verification_code, update } = req.body;
        const UserModel = req.User;
        let data = {};
        if (mobile && verification_code) {
            data = { mobile: mobile }
        } else if (email && verification_code) {
            data = { email: email }
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        data.verification_code = Number(verification_code);
        let updatedData = update ? { is_verify: 1, status: 2 } : { is_verify: 1 };
        updatedData.verification_code = Number(verification_code)
        User.update(UserModel, data, updatedData).then((result) => {
            if (!result) {
                res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(`${INVALID_MOBILE_EMAIL} or ${INVALID_VERIFICATION_CODE}`));
            } else {
                res.status(SUCCESS_STATUS).json(successResult({}, OTP_MATCHED))
            }
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
    }

    /*Controller for forgot password*/
    forgotPassword = (req, res) => {
        let { mobile, email } = req.body;
        const UserModel = req.User;
        let data = {};
        if (mobile) {
            data = { mobile: mobile }
        } else if (email) {
            data = { email: email }
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        User.findOne(UserModel, data).then((user) => {
            if (!user) {
                res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(INVALID_MOBILE_EMAIL));
            } else {
                let country_code = user.get('country_code');
                let verification_code = generateRandomString();
                let dbql = mobile ? twilio.sendMessageTwilio(VERIFICATION_MESSAGE + verification_code, country_code + mobile) : mail.sendMail(email, constant().nodeMailer.subject, constant().nodeMailer.text, config.nodeMailer_email, constant().nodeMailer.html + verification_code);
                dbql.then((result) => {
                    User.update(UserModel, data, { verification_code }).then((result) => {
                        res.status(SUCCESS_STATUS).json(successResult({}, OTP_SENT))
                    }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
            }
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
    }

    /*Controller for create Username*/
    createUserName = (req, res) => {
        let { access_token } = req.headers;
        let { user_name } = req.body;
        let UserModel = req.User;
        let validation = validate({ user_name });
        if (validation.status) {
            User.findOne(UserModel, { user_name: user_name })
                .then((userDetails) => {
                    if (userDetails) {
                        res.status(ALREADY_EXIST).json(successResult(USERNAME_EXIST))
                    } else {
                        User.update(UserModel, { access_token }, { user_name, status: 4 })
                            .then((result) => {
                                let response = { access_token: access_token, status: 4 }
                                response.mobile = result && result.get('mobile') || '';
                                res.status(SUCCESS_STATUS).json(successResult(result))
                            })
                            .catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) })
                    }
                })
                .catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) })
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(validation.data))
        }
    }

    /*Controller for save personal details*/
    savePersonalDetails = (req, res) => {
        let { access_token } = req.headers;
        let user = req.body.user;
        let UserModel = req.User;
        if (user) {
            user = verifyData(user);
            user.status = 5;
            let { mobile } = user;
            let dbql = mobile ? User.findOne(UserModel, { mobile: mobile }) : User.update(UserModel, { access_token }, user)
            dbql.then((result) => {
                if (mobile) {
                    if (result) {
                        res.status(ALREADY_EXIST).json(parameterMissing({ mobile: MOBILE_NUMBER_MESSAGE }));
                    } else {
                        User.update(UserModel, { access_token }, user).then((insertData) => {
                            res.status(SUCCESS_STATUS).json(successResult({ access_token, status: 5 }))
                        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
                    }
                } else {
                    res.status(SUCCESS_STATUS).json(successResult({ access_token, status: 5 }))
                }
            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing());
        }
    }

    /*Controller for get intresting topics*/
    intrestingTopics = (req, res) => {
        Topics.findOne(req.Intresting_topics, {}).then((topic) => {
            res.status(SUCCESS_STATUS).json(successResult(topic.get('interests')))
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
    }


    /*Controller for save intreset*/
    saveInterest = (req, res) => {
        let { access_token } = req.headers;
        let { list } = req.body;
        let UserModel = req.User;
        list = (!list && !Array.isArray(list)) ? list = [] : list;
        User.update(UserModel, { access_token }, { user_interest: list, status: 6 }).then((insertData) => {
            res.status(SUCCESS_STATUS).json(successResult(insertData))
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
    }

    /*Controller for logout*/
    logout = (req, res) => {
        let { access_token } = req.headers;
        let UserModel = req.User;
        User.update(UserModel, { access_token }, { access_token: '' }).then((insertData) => {
            res.status(SUCCESS_STATUS).json(successResult({}, USER_LOGOUT_MESSAGE))
        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
    }

    /*Controller for reset password*/
    resetPassword = (req, res) => {
        let UserModel = req.User;
        let data;
        let { mobile, email, password } = req.body;
        if (mobile && password) {
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing())
            return;
        }
        if (data) {
            User.update(UserModel, data, { password: encodePassword(password) }).then((insertData) => {
                if (insertData) {
                    res.status(SUCCESS_STATUS).json(successResult({}, PASSWORD_CHANGE_MESSAGE))
                } else {
                    res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(INVALID_MOBILE_EMAIL))
                }
            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)) });
        }
    }

    /*Controller for get other user profile*/
    getOtherUsers = (req, res) => {
        let UserModel = req.User;
        let { list } = req.body;
        let follow = [];
        let invite = [];
        let userFollow = [];
        let userFollowId = '';
        userFollowId = result.get('_id');
        userFollow = result.get('follow') || "";
        if (Array.isArray(list)) {
            async.eachSeries(list, processData, function(err) {
                if (err) {
                    res.status(BAD_REQUEST_STATUS).json(serverError(err));
                } else {
                    res.status(SUCCESS_STATUS).json(successResult({ follow, invite }));
                }
            })
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(INVALID_ARRAY));
        }

        function processData(val = [], callback) {
            let result = [];
            let where = {};
            if (val && val.mobile && val.email && val.fb_id) {
                where = { $or: [{ "mobile": { $regex: val.mobile } }, { "email": { $regex: val.email } }, { "fb_id": { $regex: val.fb_id.toString() } }] };
            } else if (val && val.mobile && val.fb_id) {
                where = { $or: [{ "mobile": { $regex: val.mobile } }, { "fb_id": { $regex: val.fb_id.toString() } }] };
            } else if (val && val.email && val.fb_id) {
                where = { $or: [{ "email": { $regex: val.email } }, { "fb_id": { $regex: val.fb_id.toString() } }] };
            } else if (val && val.email && val.mobile) {
                where = { $or: [{ "email": { $regex: val.email } }, { "mobile": { $regex: val.mobile } }] };
            } else if (val && val.fb_id) {
                where = { $or: [{ "fb_id": { $regex: val.fb_id.toString() } }] };
            } else if (val && val.email) {
                where = { $or: [{ "email": { $regex: val.email } }] };
            } else if (val && val.mobile) {
                where = { $or: [{ "mobile": { $regex: val.mobile } }] };
            } else {
                where = '';
            }
            if (where) {
                UserModel.find(where, { "_id": 1, "mobile": 1, "email": 1, "full_name": 1, "profile_picture.path": 1, "profile_picture.profile_picture_format": 1, "follow": 1, "status": 1 }, function(err, response) {
                    if (err) {
                        callback(err)
                    } else {
                        if (response && response.length) {
                            _.map(response, (val, key) => {
                                let follow = val._id;
                                let full_name = val.get('full_name') || "";
                                let status = val.get('status') ? val.get('status') : 0;
                                if (!userFollow.includes(follow.toString()) && !(userFollowId.toString() == follow.toString()) && status == 6 && full_name) {
                                    let resp = {};
                                    resp.id = val._id;
                                    resp.email = val.get('email') || "";
                                    resp.mobile = val.get('mobile') || "";
                                    resp.full_name = full_name;
                                    resp.profile_picture = val.get('profile_picture') && val.get('profile_picture').path || "";
                                    resp.profile_picture_format = val.get('profile_picture') && val.get('profile_picture').profile_picture_format || 0;
                                    result.push(resp);
                                }
                            })
                            follow = mergeArray(follow, result)
                        } else {
                            if (!val.fb_id) {
                                invite.push(val)
                            }
                        }
                        callback(null);
                    }
                })
            } else {
                callback(null);
            }
        }
    }

    /*Controller for change mobile*/
    changeMobile = (req, res) => {
        let { access_token } = req.headers;
        let { mobile, country_code } = req.body;
        let UserModel = req.User;
        let data = validate({ mobile, country_code });
        if (data.status) {
            User.findOne(UserModel, { mobile }).then((mobileData) => {
                if (mobileData) {
                    res.status(ALREADY_EXIST).json(parameterMissing(MOBILE_NUMBER_MESSAGE));
                } else {
                    country_code = countryCode(country_code);
                    let verification_code = generateRandomString();
                    data = data.data;
                    data.country_code = country_code;
                    data.verification_code = verification_code;
                    twilio.sendMessageTwilio(VERIFICATION_MESSAGE + verification_code, country_code + mobile)
                        .then((result) => {
                            User.update(UserModel, { access_token }, data).then((result) => {
                                res.status(SUCCESS_STATUS).json(successResult({ access_token }, OTP_SENT))
                            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                        }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
                }
            }).catch((e) => { res.status(BAD_REQUEST_STATUS).json(serverError(e)); });
        } else {
            res.status(PARAMETER_MISSING_STATUS).json(parameterMissing(data.data));
        }
    }

}

const controller = new UserController();
export default controller;