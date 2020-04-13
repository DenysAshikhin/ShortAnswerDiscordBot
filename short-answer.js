const Discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const mongoose = require('mongoose');

const prefix = "sa!";
const uri = 'mongodb+srv://shortAnswer:shortAnswer@cluster0-x2hks.mongodb.net/test?retryWrites=true&w=majority';

var token = "";
var Client = new Discord.Client();
var guild = new Discord.Guild();

const createrID = '99615909085220864';
const botID = '689315272531902606';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const connectDB = mongoose.connection;

const games = ["HALO", "LEAGE_OF_LEGENDS", "ROCKET_LEAGUE", "BORDERLANDS_3", "WARFRAME", "RUST", "OSU", "RISK_OF_RAIN", "RISK_OF_RAIN_2",
    "SPACE_ENGINEERS", "INSURGENCY", "MINECRAFT", "PORTAL_2", "PATH_OF_EXILE", "COUNTER_STRIKE:GLOBAL_OFFENSIVE",
    "VALIRANT", "FOREST", "KILLING_FLOOR", "CIVILIZATION_V", "CIVILIZATION_VI", "UNTURNED", "DUNGEON_OF_THE_ENDLESS",
    "DECEIT", "ENDLESS_SPACE_2"];


const getUsers = async function () {
    try {
        return await User.find({})
    } catch (err) { console.log(err) }
}

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
    Client.login(token);

    Client.on("ready", () => {

        console.log("Ready!");

        Client.user.setActivity("Giving Answers");
    })


    let questions = new Array();

    Client.on("message", async (message) => {

        if (message.member.id != botID) {

            updateMessage(message);

            if (message.content.substr(0, prefix.length) == prefix) {

                let command = message.content.split(' ')[0];
                command = command.substr(prefix.length);
                let param1 = message.content.split(' ')[1];
                if (param1 == undefined)
                    param1 = "";

                if (command.startsWith("emptyDB") && (message.author.id == createrID)) {

                    User.deleteMany({}, function (err, users) {

                        console.log(err);
                        console.log(JSON.stringify(users) + " deleted from DB");
                    })
                }
                else if (command.startsWith("initialiseUsers")) {

                    initialiseUsers(message);
                }//Need to test the one below
                else if ((message.member.hasPermission(Discord.Permissions.MANAGE_MESSAGES, { checkAdmin: false, checkOwner: false })) && command.startsWith("delete")) {

                    if (param1 == undefined) param1 = 1;
                    else if (isNaN(param1)) param1 = 1;
                    else if (param1 > 100) param1 = 100;
                    await message.channel.messages.fetch({ limit: param1 }).then(messages => { // Fetches the messages
                        message.channel.bulkDelete(messages).catch(err => {
                            console.log("Error deleting bulk messages: " + err);
                            message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
                        });
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
                else if (command.startsWith("signUp")) {

                    await updateGames(message.member, message.content.split(' ').splice(1));
                    await signedUpGames(message);
                }
                else if (command.startsWith("gamesList")) {
                    message.channel.send("```" + games.toString() + "```");
                }
                else if (command.startsWith("myGames")) {
                    message.channel.send("```" + message.member.displayName + " here are the games you are signed up for: " +
                        (await findUser({ id: message.member.id })).games + "```");
                }
                else if (command.startsWith("ping")) {
                    pingUsers(message, param1.toUpperCase());
                }
                else if (command.startsWith("removeGame")) {
                    removeGame(message, param1.toUpperCase());
                }
                else if (command.startsWith("exclude")) {
                    exclude(message, param1);
                }
            }
        }
    });

    Client.on('guildMemberAdd', member => {

        member.guild.channels.cache.get('697610639132327966').send("Welcome to the server " + member.displayName + "!");

        checkExistance(member);
    });
});

async function updateMessage(message) {

    let user = await findUser({ id: message.member.id });
    let messages = user.messages.split("|");
    let lastMessage = user.lastMessage.split("|");
    let guilds = user.guilds.split("|");
    let index = guilds.indexOf(message.guild.id);


    messages[index] = Number(messages[index]) + 1 + "";
    lastMessage[index] = getDate();

    let stringMessage = "";
    let stringLastMessage = "";

    messages.forEach(message => {

        if (message.length > 0)
            stringMessage += message + "|";
    });

    lastMessage.forEach(element => {

        console.log("ON: " + element.length);
        if (element.length > 0)
            stringLastMessage += element + "|";
    });

    let changed = await User.findOneAndUpdate({ id: message.member.id },
        {
            $set: { messages: stringMessage, lastMessage: stringLastMessage }
        });
}

async function exclude(message, bool) {

    if (bool == "true") {

        let changed = await User.findOneAndUpdate({ id: message.member.id },
            {
                $set: { exclude: true }
            });
        message.channel.send(mention(message.member.id) + " will be excluded from any further summons.");
        return;
    }
    else
        User.findOneAndUpdate({ id: message.member.id },
            {
                $set: { exclude: false }
            });
    message.channel.send(mention(message.member.id) + " can now be summoned once more.");
}

function getDate() {

    let today = new Date();
    return today.getUTCDate() + "%" + (Number(today.getMonth()) + 1) + "%" + today.getFullYear();
}

async function removeGame(message, game) {

    let boring = await findUser({ id: message.member.id });
    let gameArr = boring.games.split("|");

    gameArr.splice(gameArr.indexOf(game), 1);
    let finalGameList = "";

    for (let i = 0; i < gameArr.length; i++) {

        if (gameArr[i].length > 1) {

            finalGameList += gameArr[i] + "|";
            console.log('adding: ' + gameArr[i]);
        }
    }

    let changed = await User.findOneAndUpdate({ id: message.member.id },
        {
            $set: { games: finalGameList }
        });

    signedUpGames(message)
}

async function signedUpGames(message) {

    message.channel.send(mention(message.member.id) + " your new signedUp game list is: " +
        "``` " + (await findUser({ id: message.member.id })).games + " ```");
}

function mention(id) {
    return "<@" + id + ">"
}

async function pingUsers(message, game) {

    if (!games.includes(game))
        return;

    let users = await getUsers();
    let signedUp = "";
    let defaulted = "";

    users.forEach(async user => {

        if (user.guilds.split("|").includes(message.guild.id)) {

            if (user.games.split("|").includes(game)) {

                signedUp += mention(user.id);
            }

            else if (user.games.length < 2) {

                defaulted += mention(user.id);
            }
        }
    });

    message.channel.send(message.member.displayName + " has summoned " + signedUp + " for some " + game);
    // if (defaulted.length > 1) {

    //     message.channel.send(defaulted + "``` you have yet to exlcude yourself from summons or signUp for a game so have been pinged by default"
    //         + " if you wish to never be summoned for games, type sa!exclude, or signUp for at least one game. Type " + prefix + " for more information```");
    // }NOTE ENABLE LATER
}

async function createUser(member) {

    let newUser = {
        displayName: member.displayName,
        id: member.id,
        messages: 0 + "|",
        lastMessage: "0%0%0|",
        timeTalked: 0 + "|",
        lastTalked: "0%0%0|",
        games: "",
        timeAFK: 0 + "|",
        dateJoined: getDate() + "|",
        exclude: false,
        guilds: member.guild.id + "|"
    }

    let userModel = new User(newUser);
    await userModel.save(function (err, user) {

        if (err) return console.error(err)
        console.log('saved ' + user.displayName);
    });
}

async function addGuild(member, memberDB) {

    let changed = await User.findOneAndUpdate({ id: member.id },
        {
            $set: {
                messages: memberDB.messages + 0 + "|",
                lastMessage: memberDB.lastMessage + "0%0%0|",
                timeTalked: memberDB.timeTalked + 0 + "|",
                lastTalked: memberDB.lastTalked + "0%0%0|",
                timeAFK: memberDB.timeAFK + 0 + "|",
                dateJoined: memberDB.dateJoined + getDate() + "|",
                guilds: memberDB.guilds + member.guild.id + "|"
            }
        });
}

async function updateGames(member, game) {

    let setty = new Set(game);
    game = Array.from(setty);
    let memberDB = await findUser({ id: member.id });
    let existingGames = memberDB.games.split("|");
    let finalString = memberDB.games;

    game.forEach(async gameTitle => {

        gameTitle = gameTitle.toUpperCase();

        if (games.includes(gameTitle)) {


            if (!existingGames.includes(gameTitle)) {

                finalString += gameTitle + "|";
            }
        }
    });

    let changed = await User.findOneAndUpdate({ id: member.id },
        {
            $set: { games: finalString }
        });
}

async function checkExistance(member) {

    let tempUser = await findUser({ id: member.id })
    if (tempUser != null) {//Need to keep in mind this bot could be in multiple guilds~

        let guilds = tempUser.guilds.split("|");

        if (tempUser.guilds.split("|").includes(member.guild.id + ""))
            return true;
        else {//The user exists, but not with a matching guild in the DB

            addGuild(member, tempUser)
            return true;
        }
    }
    return false;
}

async function initialiseUsers(message) {

    let members = message.channel.guild.members;

    members.cache.forEach(async member => {

        if (await (checkExistance(member))) {//User exists with a matching guild in the DB
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