const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({

    name: String,
    token: String
});

module.exports = mongoose.model('Bot', BotSchema);