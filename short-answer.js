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
    try {
        return await User.findOne(params)
    } catch (err) { console.log(err) }
}

const findBot = async function (params) {
    try {
        return await Bot.findOne(params)
    } catch (err) { console.log(err) }
}

connectDB.once('open', async function () {

    token = await findBot({ name: "bot" });
    token = token.token;
    client.login(token);

    client.on("ready", () => {

        console.log("Ready!");

        client.user.setActivity("Giving Answers");
    })


    let questions = new Array();

    client.on("message", async (message) => {

        if (message.content.substr(0, prefix.length) == prefix) {

            let command = message.content.split(' ')[0];
            command = command.substr(prefix.length);
            let param1 = message.content.split(' ')[1];

            if (command.startsWith("emptyDB") && (message.author.id == 99615909085220864)) {

                User.deleteMany({}, function (err, users) {

                    console.log(err);
                    console.log(JSON.stringify(users) + " deleted from DB");
                })
            }
            else if (command.startsWith("initialiseUsers")) {

                initialiseUsers(message);
            }
            else if ((message.author.id == 99615909085220864) && command.startsWith("delete")) {

                if(param1 == undefined) param1 = 1;
                else if(isNaN(param1)) param1 = 1;
                await message.channel.messages.fetch({ limit: param1 }).then(messages => { // Fetches the messages
                    message.channel.bulkDelete(messages).catch(err => {console.log("Error delete bulk: " + err)});
                });
            }
            else if (command.startsWith("populate")) {

                for (i = 1; i <= param1; i++) {

                    await message.channel.send(i).then(sent => {

                        reactAnswers(sent);
                        questions.push(sent);
                    });
                }
                message.delete();
                // graphs();
            }
        }
    });

    client.on('guildMemberAdd', member => {

        member.guild.channels.cache.get('697610639132327966').send("Welcome to the server " + member.displayName + "!");
        createUser(member);
    });
});



async function createUser(member) {

    let today = new Date();

    let newUser = {
        displayName: member.displayName,
        id: member.id,
        messages: 0,
        lastMessage: "0|0|0",
        timeTalked: 0,
        lastTalked: "0|0|0",
        games: "",
        timeAFK: 0,
        dateJoined: today.getUTCDate() + "|" + (Number(today.getMonth()) + 1) + "|" + today.getFullYear()
    }

    let userModel = new User(newUser);
    await userModel.save(function (err, user) {

        if (err) return console.error(err)
        console.log('saved ' + user.displayName);
    });
}

async function initialiseUsers(message) {

    let members = message.channel.guild.members;

    members.cache.forEach(async member => {

        let tempUser = await findUser({ id: member.id })
        console.log("checking member: " + member.displayName);
        if (tempUser != null) {//Need to keep in mind this bot could be in multiple guilds~
            console.log("User already exists in DB")
        }
        else {

            createUser(member);
        }
    });
}

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

    //let changed = await User.findOneAndUpdate({displayName: "WOW"}, {$set: {displayName: "MOM"}});
    //console.log(userModel); - what I want
    //console.log(JSON.stringify(userModel)); works but the one above is better