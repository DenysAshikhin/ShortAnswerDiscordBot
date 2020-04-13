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
    exclude:{
        type: Boolean
    },
    guilds: {
        type: String
    }
});

module.exports = mongoose.model('User', UserSchema);