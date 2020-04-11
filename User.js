const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    displayName:{
        type: String
    },
    id:{
        type: Number
    },
    messages:{
        type: Number
    },
    lastMessage:{
        type: String
    },
    timeTalked:{
        type: Number
    },
    lastTalked:{
        type: String
    },
    games:{
        type: String
    },
    timeAFK:{
        type: Number
    },
    dateJoined:{
        
    }
});

module.exports = mongoose.model('User', UserSchema);