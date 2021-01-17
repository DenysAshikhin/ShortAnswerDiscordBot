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
    twitchHERE: {
        type: Boolean,
        default: true
    },
    youtubeHERE: {
        type: Boolean,
        default: true
    },
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
    factionNewMemberPoints: {
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
    blacklistedGiveRepRoles: {
        type: [],
        default: []
    },
    commandChannelWhiteList: {
        type: [],
        default: []
    },
    thankerMessageChannel: {
        type: [],
        default: []
    },
    musicRole: {
        type: String,
        default: ''
    },
    welcomeMessage: {
        type: String,
        default: '-1'
    },
    youtubeAlerts: {
        type: Map,
        default: []
    },
    gameRolePing: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('Guild', GuildSchema, 'Guild');