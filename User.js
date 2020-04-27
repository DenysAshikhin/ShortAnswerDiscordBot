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

});

module.exports = mongoose.model('User', UserSchema);