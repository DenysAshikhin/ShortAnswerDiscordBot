const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({

    id: String,
    prefix: String,
    name: String,
    songs: [String],
    duration: Number,
    Users: [],
    channelTwitch: [],
    twitchNotifications: [],
    RLTracker: [],
    gameSuggest: [],
    factions: {
        default: [],
        type: []
    },
    factionNewMemberAlert: {
        default: '',
        type: String
    },
    factionLiveTally: {},
    autorole: {
        type: [],
        default: []
    },
    welcomeMessages: {
        type: Boolean,
        default: false
    },
    passwordLock: {

        type: Map,
        of: String
    }
});

module.exports = mongoose.model('Guild', GuildSchema);