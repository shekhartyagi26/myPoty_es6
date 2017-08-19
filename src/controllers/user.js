import BaseAPIController from "./BaseAPIController";
import UserProvider from "../providers/UserProvider.js";
import User from "../models/User.js";
import generatePassword from 'password-generator';
import crypto from 'crypto';
import config from "../../config.json";
import { getSuccess, notFoundError, serverError, getSuccessMessage, validateEmail, successResponse, mergeArray, countryCode, generateRandomString } from "../modules/generic";
import { SUCCESS, ERROR } from "../modules/constant";
import twilio from "../modules/twilio";
import mail from "../modules/mail";
import constant from "../models/constant";
import jwt from "jwt-simple";
import { encodeToken } from "../modules/token";
import async from "async";
import _ from "lodash";

export class UserController extends BaseAPIController {

    /* Controller for User Login  */
    login = (req, res) => {
        let { email, mobile, password } = req.body;
        let data = {};
        let UserModel = req.User;
        if (mobile && password) {
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        var md5 = crypto.createHash('md5');
        md5.update(password);
        var pass_md5 = md5.digest('hex');
        data.password = pass_md5
        User.findOne(UserModel, data)
            .then((user) => {
                if (user) {
                    let access_token = encodeToken(user._id)
                    UserModel.findOneAndUpdate(data, { $set: { "access_token": access_token }, returnNewDocument: true, upsert: true }, { new: true }, (err, insertData) => {
                        if (err) {
                            res.status(ERROR);
                            res.json(successResponse(ERROR, err, 'Error.'));
                        } else {
                            if (insertData) {
                                delete insertData.get('password')
                                res.status(SUCCESS);
                                res.json(successResponse(SUCCESS, insertData, 'Logged in successfully.'));
                            } else {

                                res.status(ERROR);
                                res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                            }
                        }
                    });
                } else {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, {}, 'The username or password you entered is incorrect.'));
                }
            }).catch((e) => {
                res.status(ERROR);
                res.json(successResponse(ERROR, e, 'Error.'));
            })
    }

    signUp = (req, res) => {
        var body = req.body;
        var user_details = body.user;
        let UserModel = req.User;
        if (!user_details) {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }

        let data = {};
        let { mobile, email, password, country_code } = body.user;
        if (mobile && password && country_code) {
            country_code = countryCode(country_code);
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        User.findOne(UserModel, data)
            .then((user) => {
                if (user) {
                    res.status(ERROR)
                    res.json(successResponse(ERROR, {}, 'User already exist.'));
                } else {
                    let md5 = crypto.createHash('md5');
                    md5.update(password);
                    let pass_md5 = md5.digest('hex');
                    user_details.password = pass_md5
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
                            updatedData.access_token = encodeToken(userData._id);
                            if (mobile) {
                                twilio.sendMessageTwilio(`Please enter this verification code to verify: ${verification_code}`, country_code + mobile)
                                    .then((result) => {
                                        User.update(UserModel, data, updatedData)
                                            .then((data) => {
                                                res.status(SUCCESS)
                                                res.json(successResponse(SUCCESS, { access_token: updatedData.access_token, status: 1, mobile: mobile }, 'An OTP has been sent,please verify.'));
                                            }).catch((e) => {
                                                res.status(ERROR);
                                                res.json(successResponse(ERROR, e, "Something Went Wrong."));
                                            })
                                    }).catch((e) => {
                                        userData.remove();
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, e, 'You have entered a invalid Mobile Number.'));
                                    })
                            } else {
                                mail.sendMail(email, constant().nodeMailer.subject, constant().nodeMailer.text, config.nodeMailer_email, constant().nodeMailer.html + verification_code)
                                    .then((response) => {
                                        User.update(UserModel, data, updatedData)
                                            .then(() => {
                                                res.status(SUCCESS)
                                                res.json(successResponse(SUCCESS, { access_token: updatedData.access_token, status: 1, email: email }, 'An OTP has been sent, Please verify.'));
                                            }).catch((e) => {
                                                res.status(ERROR);
                                                res.json(successResponse(ERROR, e, 'Error.'));
                                            })
                                    })
                                    .catch((e) => {
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, e, 'Error.'));
                                    });
                            }
                        }).catch((e) => {
                            res.status(ERROR);
                            res.json(successResponse(ERROR, e, 'Error.'));
                        })
                }
            }).catch((e) => {
                res.status(ERROR)
                res.json(successResponse(ERROR, e, 'Error.'));
            })
    }

    socialLogin = (req, res) => {
        let body = req.body;
        let user = body.user;
        if (!user) {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        let password = '';
        let fb_id = user.fb_id;
        if (fb_id) {
            user.type = 'facebook';
            password = generatePassword(6);
            user.password = password;
            user.created_on = new Date();
            user.timeStamp = new Date().getTime();
            user.is_verify = 0;
            user.is_deleted = 0;
            user.is_blocked = 0;
            user.modified_on = new Date();
            user.status = 2;
            const UserModel = req.User;
            var userObj = user;
            User.findOne(UserModel, { fb_id: fb_id })
                .then((user_details) => {
                    if (user_details) {
                        let access_token = encodeToken(user_details._id)
                        UserModel.findOneAndUpdate({ fb_id: fb_id }, { $set: { access_token: access_token } }, { new: true }, (err, response) => {
                            if (err) {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, e, 'Error.'));
                            } else {
                                res.status(SUCCESS)
                                res.json(successResponse(SUCCESS, response, 'Logged in successfully.'));
                            }
                        })
                    } else {
                        User.save(UserModel, user)
                            .then((userData) => {
                                let access_token = encodeToken(userData._id)
                                userData.access_token = access_token;
                                User.update(UserModel, { fb_id: fb_id }, { access_token: access_token })
                                    .then((resp) => {
                                        res.status(SUCCESS)
                                        res.json(successResponse(SUCCESS, resp, 'Logged in successfully.'));
                                    }).catch((e) => {
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, e, 'Error.'));
                                    })
                            }).catch((e) => {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, e, 'Error.'));
                            })
                    }
                }).catch((e) => {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, e, 'Error.'));
                })
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
        }
    }

    verifyCode = (req, res) => {
        let { mobile, email, verification_code, update } = req.body;
        const UserModel = req.User;
        let data = {};
        if (mobile && verification_code) {
            data = { mobile: mobile }
        } else if (email && verification_code) {
            data = { email: email }
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        User.findOne(UserModel, data)
            .then((user) => {
                if (!user) {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, {}, 'User not found.'));
                } else {
                    let updatedData;
                    if (update) {
                        updatedData = { is_verify: 1, status: 2 };
                    } else {
                        updatedData = { is_verify: 1 };
                    }
                    updatedData.access_token = user.get('access_token')
                    updatedData.verification_code = Number(verification_code)
                    data.verification_code = Number(verification_code);
                    UserModel.findOneAndUpdate(data, { $set: updatedData, returnNewDocument: true }, (err, insertData) => {
                        if (err) {
                            res.status(ERROR);
                            res.json(successResponse(ERROR, err, 'Error.'));
                        } else {
                            if (insertData) {
                                res.status(SUCCESS);
                                res.json(successResponse(SUCCESS, {}, 'OTP match successfully.'));
                            } else {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, {}, 'Invalid verification Code.'));
                            }
                        }
                    });
                }
            }).catch((e) => {
                res.status(ERROR);
                res.json(successResponse(ERROR, e, 'Error.'));
            })
    }


    forgotPassword = (req, res) => {
        let { mobile, email } = req.body;
        const UserModel = req.User;
        let data = {};
        if (mobile) {
            data = { mobile: mobile }
        } else if (email) {
            data = { email: email }
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        User.findOne(UserModel, data)
            .then((user) => {
                if (!user) {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, {}, 'Please enter the registered email or mobile number.'));
                } else {
                    let country_code = user.get('country_code');
                    let verification_code = generateRandomString();
                    // let verification_code = 123456;
                    let updatedData = { verification_code: verification_code }
                    if (mobile) {
                        twilio.sendMessageTwilio(`Please enter this verification code to verify: ${verification_code}`, country_code + mobile)
                            .then((result) => {
                                User.update(UserModel, data, updatedData)
                                    .then(() => {
                                        res.status(SUCCESS);
                                        res.json(successResponse(SUCCESS, '{}', 'An OTP has been sent,please verify.'));
                                    }).catch((e) => {
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, e, 'Something Went Wrong.'));
                                    })
                            }).catch((e) => {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, e, 'You have entered a invalid Mobile Number.'));
                            })
                    } else {
                        mail.sendMail(email, constant().nodeMailer.subject, constant().nodeMailer.text, config.nodeMailer_email, constant().nodeMailer.html + verification_code)
                            .then((response) => {
                                User.update(UserModel, data, updatedData)
                                    .then(() => {
                                        res.status(SUCCESS);
                                        res.json(successResponse(SUCCESS, '{}', 'An OTP has been sent, Please verify.'));
                                    }).catch((e) => {
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, e, 'Email not send successfully.'));
                                    })
                            })
                            .catch((e) => {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, e, 'Error.'));
                            });
                    }
                }
            }).catch((e) => {
                res.status(ERROR);
                res.json(successResponse(ERROR, e, 'Error.'));
            })
    }

    createUserName = (req, res) => {
        let { access_token } = req.headers;
        let { user_name } = req.body;
        let UserModel = req.User;
        if (access_token && user_name) {
            User.findOne(UserModel, { user_name: user_name })
                .then((userDetails) => {
                    if (userDetails) {
                        res.status(ERROR)
                        res.json(successResponse(ERROR, {}, 'Username has already exist.'));
                    } else {
                        UserModel.findOneAndUpdate({ "access_token": access_token }, { $set: { "user_name": user_name, "status": 4 }, returnNewDocument: true }, { new: true }, (err, insertData) => {
                            let response = { access_token: access_token, status: 4 }
                            if (err) {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, err, 'Error.'));
                            } else {
                                if (insertData) {
                                    if (insertData.get('mobile')) {
                                        response.mobile = insertData.get('mobile');
                                    }
                                    res.status(SUCCESS);
                                    res.json(successResponse(SUCCESS, response, 'UserName Saved successfully.'));
                                } else {
                                    res.status(ERROR);
                                    res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                                }
                            }
                        });
                    }
                }).catch((e) => {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, e, 'Error.'));
                })
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
        }
    }

    savePersonalDetails = (req, res) => {
        let { access_token } = req.headers;
        let body = req.body;
        let user = body.user;
        if (!user) {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'User Details missing.'));
            return;
        }
        let { mobile } = body.user;
        let UserModel = req.User;
        if (access_token) {
            user.status = 5;
            if (mobile) {
                User.findOne(UserModel, { mobile: mobile })
                    .then((userData) => {
                        if (userData) {
                            res.status(ERROR);
                            res.json(successResponse(ERROR, {}, 'Mobile Number already exist.'));
                        } else {
                            console.log(user)
                            UserModel.findOneAndUpdate({ "access_token": access_token }, { $set: user, returnNewDocument: true }, (err, insertData) => {
                                if (err) {
                                    res.status(ERROR);
                                    res.json(successResponse(ERROR, err, 'Error.'));
                                } else {
                                    if (insertData) {
                                        res.status(SUCCESS);
                                        res.json(successResponse(SUCCESS, { access_token: access_token, status: 5 }, 'UserName Saved successfully.'));
                                    } else {
                                        res.status(ERROR);
                                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                                    }
                                }
                            });
                        }
                    }).catch((e) => {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, e, 'Something Went Wrong.'));
                    })
            } else {
                if (user && user.mobile) {
                    user = _.omit(user, 'mobile')
                }
                UserModel.findOneAndUpdate({ "access_token": access_token }, { $set: user, returnNewDocument: true }, (err, insertData) => {
                    if (err) {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, err, 'Error.'));
                    } else {
                        if (insertData) {
                            res.status(SUCCESS);
                            res.json(successResponse(SUCCESS, { access_token: access_token, status: 5 }, 'UserName Saved successfully.'));
                        } else {
                            res.status(ERROR);
                            res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                        }
                    }
                });
            }
        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'Access token missing.'));
        }
    }

    intrestingTopics = (req, res) => {
        req.Intresting_topics.findOne({}, (err, topic) => {
            if (err) {
                res.status(ERROR);
                res.json(successResponse(ERROR, err, 'Error.'));
            } else {
                res.status(SUCCESS);
                res.json(successResponse(SUCCESS, topic.get('interests'), 'List of topics.'));
            }
        })
    }

    saveInterest = (req, res) => {
        let { access_token } = req.headers;
        let { list } = req.body;
        if (!list && !Array.isArray(list)) {
            list = [];
        }
        let UserModel = req.User;
        if (access_token) {
            UserModel.findOneAndUpdate({ "access_token": access_token }, { $set: { user_interest: list, status: 6 }, returnNewDocument: true }, { new: true }, (err, insertData) => {
                if (err) {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, err, 'Error.'));
                } else {
                    if (insertData) {
                        res.status(SUCCESS);
                        res.json(successResponse(SUCCESS, insertData, 'User interest Saved successfully.'));
                    } else {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                    }
                }
            });
        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'access token missing.'));
        }
    }

    logout = (req, res) => {
        let { access_token } = req.headers;
        let UserModel = req.User;
        if (access_token) {
            UserModel.findOneAndUpdate({ "access_token": access_token }, { $set: { access_token: "" }, returnNewDocument: true }, (err, insertData) => {
                if (err) {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, err, 'Error.'));
                } else {
                    if (insertData) {
                        res.status(SUCCESS);
                        res.json(successResponse(SUCCESS, {}, 'User logout successfully.'));
                    } else {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                    }
                }
            });
        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'Access token missing.'));
        }
    }

    resetPassword = (req, res) => {
        let UserModel = req.User;
        let data;
        let { mobile, email, password } = req.body;
        if (mobile && password) {
            data = { mobile: mobile }
        } else if (email && password) {
            data = { email: email }
        } else {
            res.status(ERROR)
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
            return;
        }
        var md5 = crypto.createHash('md5');
        md5.update(password);
        var pass_md5 = md5.digest('hex');

        if (data) {
            UserModel.findOneAndUpdate(data, { $set: { password: pass_md5 }, returnNewDocument: true }, (err, insertData) => {
                if (err) {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, err, 'Error.'));
                } else {
                    if (insertData) {
                        res.status(SUCCESS);
                        res.json(successResponse(SUCCESS, {}, 'Password changed successfully.'));
                    } else {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                    }
                }
            });
        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'Access token missing.'));
        }
    }

    getOtherUsers = (req, res) => {
        let UserModel = req.User;
        let { list } = req.body;
        let { access_token } = req.headers;
        let follow = [];
        let invite = [];
        let userFollow = [];
        let userFollowId = '';
        if (Array.isArray(list)) {
            if (access_token) {
                UserModel.findOne({ access_token: access_token }, { "follow": 1 }, (err, result) => {
                    if (err) {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, err, 'Error.'));
                    } else if (result) {
                        userFollowId = result.get('_id');
                        userFollow = result.get('follow') || "";
                        async.eachSeries(list, processData, function(err) {
                            if (err) {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, err, 'Error.'));
                            } else {
                                res.status(SUCCESS);
                                res.json(successResponse(SUCCESS, { follow: follow, invite: invite }, 'Get follow and invite saved successfully.'));
                            }
                        })
                    } else {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                    }
                })

            } else {
                res.status(ERROR);
                res.json(successResponse(ERROR, {}, 'Access token missing.'));
            }

        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'Invalid Array.'));
        }

        function processData(val, callback) {
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

    changeMobile = (req, res) => {
        let { access_token } = req.headers;
        let { mobile, country_code } = req.body;
        let UserModel = req.User;
        if (access_token && mobile && country_code) {
            User.findOne(UserModel, { access_token: access_token })
                .then((user) => {
                    if (user) {
                        User.findOne(UserModel, { mobile: mobile })
                            .then((mobileData) => {
                                if (mobileData) {
                                    res.status(ERROR);
                                    res.json(successResponse(ERROR, {}, 'Mobile number already exist.'));
                                } else {
                                    country_code = countryCode(country_code);
                                    let verification_code = generateRandomString();
                                    let updatedData = { verification_code: verification_code }
                                    updatedData.mobile = mobile;
                                    updatedData.country_code = country_code;
                                    twilio.sendMessageTwilio(`Please enter this verification code to verify: ${verification_code}`, country_code + mobile)
                                        .then((result) => {
                                            User.update(UserModel, { access_token: access_token }, updatedData)
                                                .then((data) => {
                                                    res.status(SUCCESS)
                                                    res.json(successResponse(SUCCESS, { access_token: access_token }, 'An OTP has been sent, please verify.'));
                                                }).catch((e) => {
                                                    res.status(ERROR);
                                                    res.json(successResponse(ERROR, e, "Something went wrong."));
                                                })
                                        }).catch((e) => {
                                            res.status(ERROR);
                                            res.json(successResponse(ERROR, e, 'You have entered a invalid mobile number.'));
                                        })
                                }
                            }).catch((e) => {
                                res.status(ERROR);
                                res.json(successResponse(ERROR, {}, 'Something went wrong'));
                            })
                    } else {
                        res.status(ERROR);
                        res.json(successResponse(ERROR, {}, 'Invalid access token.'));
                    }
                }).catch((e) => {
                    res.status(ERROR);
                    res.json(successResponse(ERROR, {}, 'Something went wrong'));
                })
        } else {
            res.status(ERROR);
            res.json(successResponse(ERROR, {}, 'Some parameter missing.'));
        }
    }

}

const controller = new UserController();
export default controller;