const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({

    id: String,
    prefix: String
});

module.exports = mongoose.model('Guild', GuildSchema);