const mongoose = require('mongoose');

const StatSchema = new mongoose.Schema({

    date: {
        type: String
    },
    dailyActions: {
        type: [],
        default: []
    },
    dailyCommands: {

        type: [],
        default: []
    }
});

module.exports = mongoose.model('Stats', StatSchema);