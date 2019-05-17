const findOne = (db, data) => {
    return new Promise((resolve, reject) => {
        db.findOne(data, function(err, user) {
            if (err) {
                reject(err);
            } else {
                resolve(user);
            }
        })
    })
};


export default {
    findOne
};