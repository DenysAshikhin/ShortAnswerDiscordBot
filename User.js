const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    displayName: {
        type: String
    },
    id: {
        type: String
    },
    messages: {
        type: [Number]
    },
    lastMessage: {
        type: [String]
    },
    timeTalked: {
        type: [Number]
    },
    lastTalked: {
        type: [String]
    },
    games: {
        type: [String]
    },
    timeAFK: {
        type: [Number]
    },
    dateJoined: {
        type: [String]
    },
    excludePing: {
        type: Boolean
    },
    excludeDM: {
        type: Boolean
    },
    guilds: {
        type: [String]
    },
    activeTutorial: {
        type: Number,
        default: -1
    },
    tutorialStep: {
        type: Number,
        default: -1
    },
    previousTutorialStep: {
        type: Number,
        default: -1
    },
    notifyUpdate: {
        type: Boolean,
        default: true
    },
    notifyTutorial: {
        type: Boolean,
        default: true
    },
    completedTutorials: {
        type: [Number],
        default: []
    },
    canSuggest: {
        type: Boolean,
        default: false
    },
    summoner: {
        type: [Number],
        default: []
    },
    kicked: {
        type: [Boolean],
        default: []
    },
    prefix: {
        type: [String],
        default: []
    },
    defaultPrefix: {
        type: String,
        default: "-1"
    },
    playlists: [],
    commands: [],
    twitchFollows: [],
    linkedTwitch: {
        type: String,
        default: ''
    },
    twitchNotifications: [],
    linkedLeague: [],
    suggestionBan: {
        type: Boolean,
        default: false
    },
    suggestionBanDate: {
        type: String,
        default: '0-0-0000'
    },
    commandSuggestions: {
        type: Boolean,
        default: false
    },
    reps: {
        type: Map,
        of: String
    },
    youtubeAlerts: {
        type: Map
    },
    autoRepDate: {
        type: String,
        default: '0-0-0000'
    }
});

module.exports = mongoose.model('User', UserSchema, 'User');