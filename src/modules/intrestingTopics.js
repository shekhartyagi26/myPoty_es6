var _ = require('lodash');
var mongoose = require('mongoose')
var conn_pg_catalog_urls = mongoose.createConnection('mongodb://127.0.0.1/mipoty');

var schema_intresting_topics = mongoose.Schema({}, {
    strict: false,
    collection: 'intresting_topics'
});
var conn_intresting_topics = conn_pg_catalog_urls.model('intresting_topics', schema_intresting_topics);
var topics = {
    interests: [{
            "id": 1,
            "name": "Cricket",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 2,
            "name": "Hockey",
            "picture": "http://www.smartcc365.com/data/out/84/1052610.jpg"
        },
        {
            "id": 3,
            "name": "Tennis",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 4,
            "name": "Chess",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 5,
            "name": "Places",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 6,
            "name": "Football",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 7,
            "name": "Movie",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 8,
            "name": "Songs",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 9,
            "name": "Video",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 8,
            "name": "Reading",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 10,
            "name": "Cooking",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 11,
            "name": "Dancing",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 12,
            "name": "Drama",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 13,
            "name": "Fashion",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 14,
            "name": "Panting",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        }, {
            "id": 15,
            "name": "Singing",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 16,
            "name": "Puzzles",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 17,
            "name": "Sketching",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 18,
            "name": "Writing",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 19,
            "name": "Driving",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        },
        {
            "id": 20,
            "name": "Rock Climbing",
            "picture": "http://images.indianexpress.com/2016/05/virat1.jpg"
        }
    ]
}

var record = new conn_intresting_topics(topics);
record.save(function(err) {
    if (err) {
        console.log({ status: 0, message: err })
    } else {
        console.log('done');
        process.exit();
    }
})