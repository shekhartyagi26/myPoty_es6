import _ from 'lodash';
import { BAD_REQUEST_MESSAGE, SUCCESS_MESSAGE, INVALID_ACCESS_TOKEN_MESSAGE, PARAMETER_MISSING_MESSAGE } from '../constant/message';
import crypto from 'crypto';

const generateResponse = ({ status, message = null, description = null, data = {} }) => {
    return {
        status: status.toString(),
        error: {
            message,
            description,
        },
        data: (Array.isArray(data)) ? fromAryToObj(data) : data
    }
};

const getSuccess = (results) => {
    return generateResponse({ status: 200, data: results })
};

const getSuccessMessage = (message = {}) => {
    return generateResponse({ status: 200, message: message })
};

const notFoundError = (e) => {
    return generateResponse({ status: 404, message: e })
};

const serverError = (response = {}, message = BAD_REQUEST_MESSAGE) => {
    return ({
        response,
        message
    })
};
const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const successResponse = (status = 200, response = '{}', message = "", flag = 1) => {
    return ({
        // "status": status,
        "flag": flag,
        "response": response,
        "message": message
    });
}
const checkBlank = (arr) => {
    _.map(arr, (val, key) => {
        if (val == '' || val === "" || val == undefined) {
            return ('Some parameters missing');
        } else {
            if (key == (_.size(arr) - 1)) {
                return (null, 'done');
            }
        }
    })
};

const mergeArray = (arr1 = [], arr2 = []) => {
    return _(arr1).keyBy('id').merge(_.keyBy(arr2, 'id')).values().value();
}

const countryCode = (country_code) => {
    if (!country_code.includes("+")) {
        country_code = '+' + country_code
    };
    return country_code;
}

const generateRandomString = () => {
    return Math.floor(1000 + Math.random() * 9000);
}


const successResult = (response = '{}', message = SUCCESS_MESSAGE, flag = 1) => {
    return ({
        response,
        message,
        flag
    });
}

const invalidToken = (message = INVALID_ACCESS_TOKEN_MESSAGE, response = {}) => {
    return ({
        response,
        message
    })
};

const parameterMissing = (message = PARAMETER_MISSING_MESSAGE, response = {}) => {
    return ({
        response,
        message
    })
};

// verify the key's and return only those key's which have value
const verifyData = (data = {}) => {
    var result = {};
    var count = 0;
    _.map(data, (val, key) => {
        if (val && val.length) {
            result[key] = val;
        }
    })
    return result;
}

// validate the key's and return the missing keys otherwise return the valid json
const validate = (data = {}) => {
    var result = {};
    var resp = {};
    var count = 0;
    _.map(data, (val, key) => {
        if (val && val.length) {
            result[key] = val;
        } else {
            resp[key] = `${key} is missing`;
            // resp.push(`${key} is missing`);
        }
    })
    if (resp && _.size(resp)) {
        return { status: false, data: resp };
    } else {
        return { status: true, data: result };
    }
}

const encodePassword = (password = '') => {
    let md5 = crypto.createHash('md5');
    md5.update(password);
    let pass_md5 = md5.digest('hex');
    return pass_md5;
}

module.exports = {
    getSuccess,
    notFoundError,
    serverError,
    getSuccessMessage,
    validateEmail,
    successResponse,
    checkBlank,
    mergeArray,
    countryCode,
    generateRandomString,
    successResult,
    invalidToken,
    parameterMissing,
    verifyData,
    validate,
    encodePassword
};