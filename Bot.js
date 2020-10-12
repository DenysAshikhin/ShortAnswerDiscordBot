const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({

    date: {
        type: String
    },
    youtubeIDs: {
        type: Map
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

module.exports = mongoose.model('Bots', BotSchema);