const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    displayName: {
        type: String
    },
    id: {
        type: String
    },
    messages: {
        type: []
    },
    lastMessage: {
        type: []
    },
    timeTalked: {
        type: []
    },
    lastTalked: {
        type: []
    },
    games: {
        type: []
    },
    timeAFK: {
        type: []
    },
    dateJoined: {
        type: []
    },
    excludePing: {
        type: Boolean
    },
    excludeDM: {
        type: Boolean
    },
    guilds: {
        type: []
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