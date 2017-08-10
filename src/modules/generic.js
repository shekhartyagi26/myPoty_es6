import _ from 'lodash';
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

const serverError = (e) => {
    return generateResponse({ status: 500, message: e })
};
const validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const successResponse = (status = 200, response = '{}', message = "", flag = 1) => {
    return ({
        "status": status,
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
    generateRandomString
};