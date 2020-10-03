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
    },
    channelImageThanker: {
        type: [],
        default: []
    },
    channelLinkThanker: {
        type: [],
        default: []
    },
    channelImage: {
        type: [],
        default: []
    },
    channelImageSource: {
        type: [],
        default: []
    },
    forwardImages: {
        type: Boolean,
        default: false
    },
    channelThankerMessage: {
        type: String,
        default: ''
    },
    autoRep: {
        type: Boolean,
        default: true
    },
    thankerAutoRep: {
        type: Boolean,
        default: true
    },
    repRolePairs: {
        type: [],
        default: []
    },
    blacklistedRepRoles: {
        type: [],
        default: []
    },
    commandChannelWhiteList: {
        type: [],
        default: []
    },
    musicRole: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Guild', GuildSchema);