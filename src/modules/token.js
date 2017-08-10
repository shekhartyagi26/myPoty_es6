import jwt from 'jwt-simple';
import { successResponse } from "../modules/generic";


const encodeToken = (id) => {
    let secret = 'xxx';
    let payload = { _id: id, timeStamp: new Date() };
    return jwt.encode(payload, secret);
}

// const decodeToken = (token) => {
//     try {
//         return (jwt.decode(token, secret));
//     } catch (err) {
//         return (err);
//     }
// };

module.exports = {
    encodeToken
    // decodeToken
};