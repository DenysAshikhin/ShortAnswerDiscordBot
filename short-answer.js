const discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const mongoose = require('mongoose');

const prefix = "sa!";
const uri = 'mongodb+srv://shortAnswer:shortAnswer@cluster0-x2hks.mongodb.net/test?retryWrites=true&w=majority';

var token = "";
var client = new discord.Client();
var guild = new discord.Guild();

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const connectDB = mongoose.connection;


const findUser = async function (params) { 
    try {  return await User.findOne(params)
    } catch(err) { console.log(err) }
}

const findBot = async function (params) {
    try{ return await Bot.findOne(params)
    } catch(err){ console.log(err)}
}

connectDB.once('open', async function () {


    User.find({ displayName: "WOW" }, function (err, result) {

       //console.log("SIZE: " + result.length);


        // result.forEach(element => {
        //         console.log("found: " + element);
        // });//
    })


    token = await findBot({name: "bot"});
    token = token.token;


    let userSteve = await findUser({displayName: "WOW"})

    if(userSteve.displayName == "WOWP"){

        let newUser = {
            displayName: "WOW",
            id: 2222,
            messages: 1,
            lastMessage: "neeee,",
            timeTalked: 4,
            lastTalked: "dddd",
            games: "qweqwe",
            timeAFK: 7,
            dateJoined: "Not Yet lol"
        }
    
        let userModel = new User(newUser);
        await userModel.save(function (err, user) {
    
            if (err) return console.error(err)
            console.log('saved ' + user.displayName);
        });
    }
    else{

        console.log("User already exists");
    }



    //let changed = await User.findOneAndUpdate({displayName: "WOW"}, {$set: {displayName: "MOM"}});
    
    
    client.login(token);
    
    client.on("ready", () => {
    
        console.log("Ready!");
    
        client.user.setActivity("Giving Answers");
    })
    
    
    let questions = new Array();
    
    client.on("message", async (message) => {
    
        let command = message.content.split(' ')[0];
        let param1 = message.content.split(' ')[1];
    
        if ((message.author.id == 99615909085220864) && command.startsWith(prefix + "delete")) {
    
            message.delete().catch(function (err) {
    
                console.log(err);
            });
    
            try {
                await message.channel.messages.fetch({ limit: param1 }).then(messages => { // Fetches the messages
                    message.channel.bulkDelete(messages)
                });
            } catch (err) {
                console.log(err)
            }
    
            message.delete();
        }
    
        if (command.startsWith(prefix + "populate")) {
    
            for (i = 1; i <= param1; i++) {
    
                await message.channel.send(i).then(sent => {
    
                    reactAnswers(sent);
                    message.reactions.length;
                    questions.push(sent);
                });
            }
            message.delete();
            // graphs();
        }
    });
    
    client.on('guildMemberAdd', member => {
        member.guild.channels.cache.get('697610639132327966').send("Welcome to the server " + member.displayName + "!");
    });
  
    //console.log(userModel); - what I want
    //console.log(JSON.stringify(userModel)); works but the one above is better
});

async function reactAnswers(message) {

    await message.react("🇦");
    await message.react("🇧");
    await message.react("🇨");
    await message.react("🇩");
    await message.react("🇪");
    await message.react("🇫");
}

async function graphs() {

    let ch = message.channel;
    await ch.send("**= = = =**");
    for (question in questions) {

        await ch.send("**" + question.content + "**")
        let numReact = question.reactions.length;

    }
}