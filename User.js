const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    displayName:{
        type: String
    },
    id:{
        type: String
    },
    messages:{
        type: String
    },
    lastMessage:{
        type: String
    },
    timeTalked:{
        type: String
    },
    lastTalked:{
        type: String
    },
    games:{
        type: String
    },
    timeAFK:{
        type: String
    },
    dateJoined:{
        type: String   
    },
    excludePing:{
        type: Boolean
    },
    excludeDM:{
        type: Boolean
    },
    guilds: {
        type: String
    },
    activeTutorial: {
        type: Number
    },
    tutorialStep: {
        type: Number
    },
    notifyUpdate: {
        type: Boolean
    },
    notifyTutorial: {
        type: Boolean
    }
});

module.exports = mongoose.model('User', UserSchema);