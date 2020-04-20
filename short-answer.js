const Discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const ytdl = require("ytdl-core");
//const ytdl = require('ytdl-core-discord');


//test
const fs = require('fs');
const gameJSON = require('./gameslist.json')
//const studyJSON = require('./medstudy.json');
const studyJSON = require('./ouda.json');  



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

const games = new Array();
var queue = new Map();

const studyArray = new Array();


const options = {
    isCaseSensitive: true,
    findAllMatches: true,
    includeMatches: false,
    includeScore: false,
    useExtendedSearch: false,
    minMatchCharLength: 3,
    shouldSort: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    keys: [
        "name"
    ]
};

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

    gameJSON.forEach(element => {

        //console.log(element.name.split(' ').join('_'));
        //games.push(element.name.split(' ').join('_').toUpperCase());
        games.push(element.name);
    })
    games.sort();


    studyJSON.forEach(element => {
        
        studyArray.push(element);
    })
    studyArray.sort();


    Client.on("ready", () => {

        console.log("Ready!");

        Client.user.setActivity("sa!help for information");
    })

    let questions = new Array();

    Client.on("message", async (message) => {

        if (message.author.id != botID) {

            if (message.content.substr(0, prefix.length) == prefix) {

                let messageArray = message.content.split(' ');
                let command = messageArray[0];
                command = command.substr(prefix.length).toUpperCase();

                let params = message.content.substr(message.content.indexOf(' ') + 1).split(',');

                if (params[0] == undefined)
                    params[0] = "";

                // if (command.startsWith("emptyDB") && (message.author.id == createrID)) {

                //     User.deleteMany({}, function (err, users) {

                //         console.log(err);
                //         console.log(JSON.stringify(users) + " deleted from DB");
                //     })
                //     return;
                // }

                if (command.startsWith("initialiseUsers".toUpperCase())) {

                    initialiseUsers(message);
                    message.channel.send("The server's users are now tracked!");
                }//Need to test the one below
                else if ((message.member.hasPermission("MANAGE_MESSAGES", { checkAdmin: false, checkOwner: false })) && command.startsWith("delete".toUpperCase())) {

                    let amount = 0;
                    if (params[0].length <= 0) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
                    else if (isNaN(params[0])) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
                    else if (params[0] > 99) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
                    else if (params[0] < 1) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
                    else {

                        amount = Number(params[0]) + 1;
                        await message.channel.messages.fetch({ limit: amount }).then(messages => { // Fetches the messages
                            message.channel.bulkDelete(messages).catch(err => {
                                console.log("Error deleting bulk messages: " + err);
                                message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
                            });
                        });
                    }
                }
                else if (command.startsWith("populate".toUpperCase())) {

                    for (i = 1; i <= params[0]; i++) {

                        await message.channel.send(i).then(sent => {

                            reactAnswers(sent);
                            questions.push(sent);
                        });
                    }
                    message.delete();
                    // graphs();
                }
                else if (command.startsWith("signUp".toUpperCase())) {

                    await updateGames(message, params);
                }
                else if (command.startsWith("search".toUpperCase())) {
                    search(message, params);
                }
                else if (command.startsWith("myGames".toUpperCase())) {
                    personalGames(message);
                }
                else if (command.startsWith("ping".toUpperCase())) {
                    pingUsers(message, params[0].trim());
                }
                else if (command.startsWith("removeGame".toUpperCase())) {
                    removeGame(message, params);
                }
                else if (command.startsWith("exclude".toUpperCase())) {
                    if (params[0].length != undefined && params[0].length == 0)
                        message.channel.send("You must enter either true or false: " + prefix + "exclude true/false");
                    else
                        exclude(message, params[0].toUpperCase());
                }
                else if (command.startsWith("myStats".toUpperCase())) {
                    personalStats(message);
                }
                else if (command.startsWith("allStats".toUpperCase()) && message.member.hasPermission("ADMINISTRATOR")) {
                    guildStats(message);
                }
                else if (command == ("help".toUpperCase())) {
                    generalHelp(message);
                }
                else if (command.startsWith("userStats".toUpperCase())) {
                    specificStats(message, params);
                }
                else if (command.startsWith("topStats".toUpperCase())) {
                    topStats(message);
                }
                else if (command.startsWith("helpGames".toUpperCase())) {
                    gameHelp(message);
                }
                else if (command.startsWith("helpStats".toUpperCase())) {
                    helpStats(message);
                }
                else if (command.startsWith("helpMiscellaneous".toUpperCase())) {
                    helpMiscellaneous(message);
                }
                else if (command.startsWith("play".toUpperCase())) {
                    const serverQueue = queue.get(message.guild.id);
                    play(message, serverQueue);
                }
                else if (command.startsWith("stop".toUpperCase())) {
                    queue.get(message.guild.id).voiceChannel.leave();
                    queue.delete(message.guild.id);
                }
                else if (command.startsWith("pause".toUpperCase())) {
                    queue.get(message.guild.id).dispatcher.pause();
                }
                else if (command.startsWith("resume".toUpperCase())) {
                    queue.get(message.guild.id).dispatcher.resume();
                }
                else if (command.startsWith("skip".toUpperCase())) {
                    queue.get(message.guild.id).songs.shift();
                    playSong(message.guild, queue.get(message.guild.id).songs[0]);
                }
                else if(command.startsWith("helpMusic".toUpperCase())){
                    helpMusic(message);
                }
                else if(command.startsWith("study".toUpperCase())){
                    study(message,params);
                }
                updateMessage(message);
            }
        }
    });

    Client.on('guildMemberAdd', member => {

        member.guild.channels.cache.get('697610639132327966').send("Welcome to the server " + member.displayName + "!");

        checkExistance(member);
    });

    Client.on('presenceUpdate', (oldMember, newMember) => {

        console.log("hopefuly this traffic keeps it awake?");
    });
});


async function personalGames(message) {

    let games = await findUser({ id: message.member.id });
    games = games.games.split("|");
    let finalList = "";

    for (let i = 0; i < games.length; i++) {

        if (games[i].length > 1)
            finalList += i + ") " + games[i] + "\n";
    }

    if (finalList.length > 2)
        message.channel.send("```" + message.member.displayName + " here are the games you are signed up for: \n" +
            finalList + "```");

    else
        message.channel.send("You are not signed up for any games.");

}

async function gameSuggestion(member) {//


}

function findFurthestDate(date1, date2) {

    let lastDate = "";
    if ((date1.substr(6).localeCompare(date2.substr(6))) <= 0) {

        if ((date1.substr(1, 4).localeCompare(date2.substr(1, 4))) > 0) {
            return date2;
        }
        else {
            return date1;
        }
    }
    else {
        return date2
    }
}

async function topStats(message) {
    //create a stats channel to display peoples stats, top messages, loud mouth, ghost (AKF), MIA (longest not seen)
    let allUsers = await getUsers();
    let guild = message.guild;
    let silentType;
    let loudMouth;
    let ghost;
    let MIA;
    let user = null;
    for (let i = 0; i < allUsers.length; i++) {

        
        if (allUsers[i].guilds.split("|").includes(guild.id)) {
            user = allUsers[i];
            let index = user.guilds.split("|").indexOf(guild.id);

            if (silentType == undefined)
                silentType = user;
            if (loudMouth == undefined)
                loudMouth = user;
            if (ghost == undefined)
                ghost = user;
            if (MIA == undefined)
                MIA = user;

            if (Number(silentType.messages.split("|")[index]) < Number(user.messages.split("|")[index]))
                silentType = user;

            if (Number(loudMouth.timeTalked.split("|")[index]) < Number(user.timeTalked.split("|")[index]))
                loudMouth = user;

            if (Number(ghost.timeAFK.split("|")[index]) < Number(user.timeAFK.split("|")[index]))
                ghost = user;

            let userDate = findFurthestDate(user.lastMessage, user.lastTalked);
            let MIADate = findFurthestDate(MIA.lastMessage, MIA.lastTalked);

            if (userDate == findFurthestDate(userDate, MIADate)) {
                MIA = user;
            }
        }
    }

    let index = user.guilds.split("|").indexOf(guild.id);

    message.channel.send("Here are the tops stats for this server: \n```" + "The silent type: " + silentType.displayName + " : "
        + silentType.messages.split("|")[index] + " messages sent.\n"
        + "The loud mouth: " + loudMouth.displayName + " : " + loudMouth.timeTalked.split("|")[index] + " minutes spent talking.\n"
        + "The ghost: " + ghost.displayName + " : " + ghost.timeAFK.split("|")[index] + " minutes spent AFK.\n"
        + "The MIA: " + MIA.displayName + " : " + findFurthestDate(MIA.lastTalked.split("|")[index], MIA.lastMessage.split("|")[index]) + " last seen date."
        + "```");

}

async function specificStats(message) {

    message.channel.send(message.guild.members.cache.get(message.mentions.members.first().id).user.username + ", ```" + message.member.displayName + "``` requested your stats: ```"
        + (await getStats(message.mentions.members.first())) + "```");
}

async function search(message, searches) {

    if (searches == undefined || searches == null || searches.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + "gamesList counter");
        return;
    }

    searches.forEach(query => {

        if (query.length > 0) {

            message.channel.send(mention(message.member.id) + "! Here are the result for: " + query + "\n");
            let finalArray = new Array();
            let finalList = "";
            let fuse = new Fuse(games, options);

            let result = fuse.search(query);

            for (let i = 0; i < result.length; i++) {

                if (finalList.length <= 500) {

                    finalList += result[i].refIndex + ") " + result[i].item + "\n";
                }
                // if (finalList.length >= 1800) {
                //     finalArray.push(finalList);
                //     finalList = "";
                // }//Commented out because the messages just get too long and the wanted search results would be closer to the top anyways
            }

            finalArray.push(finalList);

            for (let i = 0; i < finalArray.length; i++) {

                message.channel.send("```" + finalArray[i] + "```");
            }
        }

    });
}


async function study(message, searches) {

    if (searches == undefined || searches == null || searches.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + "gamesList counter");
        return;
    }


    let options1 = {
        isCaseSensitive: true,
        findAllMatches: true,
        includeMatches: false,
        includeScore: false,
        useExtendedSearch: false,
        minMatchCharLength: 3,
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        keys: [
            "slides"
        ]
    };


    searches.forEach(query => {

        console.log("QUERY: " + query);

        if (query.length > 0) {

            message.channel.send(mention(message.member.id) + "! Here are the result for: " + query + "\n");
            let finalArray = new Array();
            let finalList = "";
            let fuse = new Fuse(studyArray, options1);


            let result = fuse.search(query);
        
            result.forEach(overall => {

                let fuse1 = new Fuse(overall.item.slides, options1);
                let result1 = fuse1.search(query);

                message.channel.send("```" + overall.item.pptName + "```");

                result1.forEach(final => {

                    message.channel.send(final.item + "\n");
                })
            })

            finalArray.push(finalList);

            for (let i = 0; i < finalArray.length; i++) {

                message.channel.send("```" + finalArray[i] + "```");
            }
        }

    });
}

async function helpMiscellaneous(message) {

    let help =
        "Command 1: " + prefix + "delete [number]\n``` Deletes the last [number] of messages if you have the 'manage messages' permission.```\n"
        + "Command 2: " + prefix + "populate [number]\n```Creates [number] of questions numbered 1 - [number] with an reaction emoji for letters A-E.```\n"
    message.channel.send(help);
}

async function helpStats(message) {

    let statsMessage =
        "Command 1: " + prefix + "myStats\n```Shows you all of your stats.```\n"
        + "Command 2: " + prefix + "userStats @User\n```Shows you the stats of the mentioned/pinged user.```\n"
        + "Command 3: " + prefix + "topStats\n```Shows the top stats for the called server.```\n"
        + "Command 4: " + prefix + "allStats\n```Shows the stats for all users on the called server. NOTE: Can only be called by the members with the ADMINSTRATOR permission.```"

    message.channel.send(statsMessage);
}

async function helpMusic(message) {

    let musicMessage =
        "Command 1: " + prefix + "play [youtube url]\n```Plays the song in the url, if one is already playing, it will be added to the queue.```\n"
        + "Command 2: " + prefix + "stop\n```Empties the queue and makes the bot leave the voice channel,```\n"
        + "Command 3: " + prefix + "pause\n```Pauses the current song.```\n"
        + "Command 4: " + prefix + "resume\n```Resumes playing the current song.```\n"
        + "Command 5: " + prefix + "skip\n```Skips the current song.```"
    message.channel.send(musicMessage);
}

async function generalHelp(message) {

    let helpMessage = "The following commands are broken down into 4 general sections: Games, Stats, Miscellaneous, and Music. Enter: \n"
        + "```" + "1) " + prefix + "helpGames  || For information on how signUp for games, how to ping games, search for a game and more.\n\n"
        + "2) " + prefix + "helpStats  || For information on how to view server, personal, top stats and more.\n\n"
        + "3) " + prefix + "helpMiscellaneous  || For information on random commands.\n\n"
        + "4) " + prefix + "helpMusic || For information on playing music.\n\n"
        + "IMPORTANT: Make sure to run " + prefix + "initiliaseUsers || otherwise the other commands will not function properly. This command adds all users from the called server to the bot's tracker.\n\n"
        + "```";

    message.channel.send(helpMessage);
}

async function gameHelp(message) {

    let gameMessage =
        "Command 1: " + prefix + "signUp [game1], [game2], [game3]...\n```Signs you up to be summoned when someone pings any of the [games] in your games list. "
        + "You can either write the full game title or the associated number.\n\n"
        + "Example usage: " + prefix + "signUp Counter-Strike: Global Offensive, 212, Minecraft...\n\nWill add three games to your gamesList.```\n"

        + "Command 2: " + prefix + "myGames\n```Show you your games list, if anyone pings a game on your games list, you will get notified.```\n"

        + "Command 3: " + prefix + "removeGame [game] \n```Removes [game] from your game list.\n\n"
        + "Example usage: " + prefix + "removeGame 2 |OR| " + prefix + "removeGame Counter-Strike: Global Offensive\n\nWill remove the game specified by the number "
        + "(which as to correspond to a game in your gamesList) or search your gamesList for the title of the game you wish to remove.```\n"

        + "Command 4: " + prefix + "exclude [true/false] \n```Sets whether you wish to be notified when someone pings a game to play. If set to 'true', you will be excluded from all pings "
        + "and vice versa.\nExample usage: " + prefix + "exclude true |OR| " + prefix + "exclude false```\n"

        + "Command 5: " + prefix + "search [game1], [game2].... \n```Searches all the complete game list for the speicified games you wish to find. You can search for as many games as desired, seperated by a comma.\n"
        + "Example usage: " + prefix + "search Counter, Overwatch, League```\n"

        + "Command 6: " + prefix + "ping [game] \n```Pings and DM's every member from the called server who have [game] in their games list and do not have the exclude status enabled.\n"
        + "Example usage: " + prefix + "ping Counter-Global: Offensive```";

    message.channel.send(gameMessage);
}

async function getStats(member) {

    let user = await findUser({ id: member.id });
    let guilds = user.guilds.split("|");
    let index = guilds.indexOf(member.guild.id);
    let stats = "";

    stats = "Total number of messages sent: " + user.messages.split("|")[index] + "\n"
        + "Last message sent: " + user.lastMessage.split("|")[index] + "\n"
        + "Total time spent talking (in minutes): " + user.timeTalked.split("|")[index] + "\n"
        + "Last time you talked was: " + user.lastTalked.split("|")[index] + "\n"
        + "The games you are signed up for: " + user.games + "\n"
        + "Time spent AFK (in minutes): " + user.timeAFK.split("|")[index] + "\n"
        + "You joined this server on: " + user.dateJoined.split("|")[index] + "\n"
        + "Whether you are excluded from summons: " + user.exclude + "\n";

    return stats;
}

async function personalStats(message) {

    message.channel.send(mention(message.member.id) + " here are your stats: ```"
        + (await getStats(message.member)) + "```");
}

async function guildStats(message) {

    message.guild.members.cache.forEach(async member => {

        message.channel.send("Here are the stats for " + member.displayName + ": ```"
            + (await getStats(member)) + "```");
    })
}

function convertToString(array) {

    let finaly = "";

    array.forEach(element => {

        if (element.length > 0)
            finaly += element + "|";
    });
    return finaly
}

async function countTalk() {

    Client.guilds.cache.forEach(async guild => {

        guild.channels.cache.forEach(async channel => {

            if (channel.type == "voice") {

                channel.members.forEach(async member => {

                    
                    let user = await findUser({ id: member.id });
                    let guilds = user.guilds.split("|");
                    let index = guilds.indexOf(guild.id);

                    if (channel.id == guild.afkChannelID) {

                        let timeAFK = user.timeAFK.split("|");
                        timeAFK[index] = (Number(timeAFK[index]) + 1).toString();

                        User.findOneAndUpdate({ id: member.id },
                            {
                                $set: { timeAFK: convertToString(timeAFK) }
                            }, function (err, doc, res) {
                                //console.log(doc);
                            });
                    } else {

                        let timeTalked = user.timeTalked.split("|");
                        timeTalked[index] = (Number(timeTalked[index]) + 1).toString();

                        let lastTalked = user.lastTalked.split("|");
                        lastTalked[index] = getDate();

                        User.findOneAndUpdate({ id: member.id },
                            {
                                $set: { timeTalked: convertToString(timeTalked), lastTalked: convertToString(lastTalked) }
                            }, function (err, doc, res) {
                                //console.log(doc);
                            });
                    }
                })
            }
        })
    })
}

async function updateMessage(message) {

    let user = await findUser({ id: message.member.id });
    let messages = user.messages.split("|");
    let lastMessage = user.lastMessage.split("|");
    let guilds = user.guilds.split("|");
    let index = guilds.indexOf(message.guild.id);

    messages[index] = Number(messages[index]) + 1 + "";
    lastMessage[index] = getDate();

    let changed = await User.findOneAndUpdate({ id: message.member.id },
        {
            $set: { messages: convertToString(messages), lastMessage: convertToString(lastMessage) }
        });
}

async function exclude(message, bool) {

    if (bool == "TRUE") {

        let changed = await User.findOneAndUpdate({ id: message.member.id },
            {
                $set: { exclude: true }
            });
        message.channel.send(mention(message.member.id) + " will be excluded from any further summons.");
        return;
    }
    else if (bool == "FALSE") {
        let changed = await User.findOneAndUpdate({ id: message.member.id },
            {
                $set: { exclude: false }
            });
        message.channel.send(mention(message.member.id) + " can now be summoned once more.");
    }
    else {
        message.channel.send("You must enter either true or false: " + prefix + "exclude true/false");
    }
}

function getDate() {

    let today = new Date();
    return today.getUTCDate() + "-" + (Number(today.getMonth()) + 1) + "-" + today.getFullYear();
}

async function removeGame(message, game) {

    let boring = await findUser({ id: message.member.id });
    let gameArr = boring.games.split("|");
    let invalidGames = "";
    let removedGames = "";


    let setty = new Set(game);
    game = Array.from(setty);
    games.sort();


    //game.forEach(async gameTitle => {

    let gameTitle = game[0];

    if (isNaN(gameTitle)) {

        gameTitle = gameTitle.toUpperCase();

        if (gameArr.includes(gameTitle)) {
            removedGames += gameArr.splice(gameArr.indexOf(gameTitle), 1) + "|";
        }
        else
            invalidGames += gameTitle + "|";
    }
    else {
        if (gameTitle < gameArr.length && gameTitle >= 0) {

            removedGames += gameArr.splice(gameTitle, 1) + "|";
        }
        else
            invalidGames += gameTitle + "|";
    }
    //});

    let finalGameList = "";
    gameArr.sort();

    for (let i = 0; i < gameArr.length; i++) {

        if (gameArr[i].length > 1) {

            finalGameList += gameArr[i] + "|";
        }
    }

    if (invalidGames.length > 2) {

        let congrats = "";
        let tempArr = invalidGames.split("|");
        tempArr.sort();
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i].length > 1)
                congrats += i + ") " + tempArr[i] + "\n";
        }
        message.channel.send("The following are invalid games: ```" + congrats + "```");
    }

    if (removedGames.length > 2) {

        let congrats = "";
        let tempArr = removedGames.split("|");
        tempArr.sort();
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i].length > 1)
                congrats += i + ") " + tempArr[i] + "\n";
        }
        message.channel.send("The following games were successfuly removed from your game list: ```" + congrats + "```");
    }

    let changed = await User.findOneAndUpdate({ id: message.member.id },
        {
            $set: { games: finalGameList }
        });
}

async function signedUpGames(message) {

    message.channel.send(mention(message.member.id) + " your new signedUp game list is: " +
        "``` " + (await findUser({ id: message.member.id })).games + " ```");
}

function mention(id) {
    return "<@" + id + ">"
}

function directMessage(message, memberID, game) {

    message.guild.members.cache.get(memberID).user.send(message.member.displayName + " has summoned you for " + game + " in "
        + message.guild.name + "!");
}

async function pingUsers(message, game) {

    if (!isNaN(game)) {

        if (game < 0 || game >= games.length)
            message.channel.send(game + " is not assigned to any games, please try again or type " + prefix + "gamesList to view the list of all games.");
        return;
    }
    else if (!games.includes(game)) {
        message.channel.send(game + " is not a valid game, please try again or type " + prefix + "gamesList to view the list of all games.");
        return;
    }

    let users = await getUsers();
    let signedUp = "";
    let defaulted = "";

    users.forEach(async user => {
        //  console.log(user.displayName + "||" + user.exclude);
        if (user.exclude == false && user.id != message.member.id) {

            if (user.guilds.split("|").includes(message.guild.id)) {

                if (isNaN(game)) {

                    if (user.games.split("|").includes(game)) {

                        signedUp += mention(user.id);
                        directMessage(message, user.id, game);
                    }
                }
                else if (user.games.split("|").includes(games[game])) {

                    signedUp += mention(user.id);
                    directMessage(message, user.id, games[game]);
                }
                else if (user.games.length < 2) {

                    defaulted += mention(user.id);
                }
            }
        }
    });

    if (signedUp.length > 3)
        message.channel.send(message.member.displayName + " has summoned " + signedUp + " for some " + game);
    else
        message.channel.send("No one has signed up for " + game + ".");
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
        lastMessage: "0-0-0|",
        timeTalked: 0 + "|",
        lastTalked: "0-0-0|",
        games: "",
        timeAFK: 0 + "|",
        dateJoined: getDate() + "|",
        exclude: false,
        guilds: member.guild.id + "|"
    }

    let userModel = new User(newUser);
    await userModel.save(function (err, user) {

        if (err) return console.error(err)
    });
}

async function addGuild(member, memberDB) {

    let changed = await User.findOneAndUpdate({ id: member.id },
        {
            $set: {
                messages: memberDB.messages + 0 + "|",
                lastMessage: memberDB.lastMessage + "0-0-0|",
                timeTalked: memberDB.timeTalked + 0 + "|",
                lastTalked: memberDB.lastTalked + "0-0-0|",
                timeAFK: memberDB.timeAFK + 0 + "|",
                dateJoined: memberDB.dateJoined + getDate() + "|",
                guilds: memberDB.guilds + member.guild.id + "|"
            }
        });
}

async function updateGames(message, game) {

    let member = message.member;
    let setty = new Set(game);
    game = Array.from(setty);
    games.sort();
    let memberDB = await findUser({ id: member.id });
    let existingGames = memberDB.games.split("|");
    let finalString = "";
    let alreadyTracked = "";
    let invalidGames = "";

    game.forEach(async gameTitle => {

        gameTitle = gameTitle.trim();

        if (isNaN(gameTitle)) {

            gameTitle = gameTitle.trim();

            if (games.includes(gameTitle)) {
                if (!existingGames.includes(gameTitle))
                    finalString += gameTitle + "|";
                else
                    alreadyTracked += gameTitle + "|"
            }
            else
                invalidGames += gameTitle + "|";
        }
        else {
            if (gameTitle < games.length && gameTitle >= 0) {

                if (!existingGames.includes(games[gameTitle])) {
                    finalString += games[gameTitle] + "|";
                }
                else
                    alreadyTracked += games[gameTitle] + "|"
            }
            else
                invalidGames += games[gameTitle] + "|";
        }
    });

    if (finalString.length > 2) {

        let congrats = "";
        let tempArr = finalString.split("|");
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i].length > 1)
                congrats += i + ") " + tempArr[i] + "\n";
        }
        message.channel.send("Succesfuly signed up for: ```" + congrats + "```");
    }

    if (alreadyTracked.length > 2) {

        let congrats = "";
        let tempArr = alreadyTracked.split("|");
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i].length > 1)
                congrats += i + ") " + tempArr[i] + "\n";
        }
        message.channel.send("The following games are already tracked for you: ```" + congrats + "```");
    }

    if (invalidGames.length > 2) {

        let congrats = "";
        let tempArr = invalidGames.split("|");
        for (let i = 0; i < tempArr.length; i++) {
            if (tempArr[i].length > 1)
                congrats += i + ") " + tempArr[i] + "\n";
        }
        message.channel.send("The following are invalid games: ```" + congrats + "```");
    }

    let changed = await User.findOneAndUpdate({ id: member.id },
        {
            $set: { games: memberDB.games + finalString }
        });
}

async function checkExistance(member) {

    let tempUser = await findUser({ id: member.id })
    if (tempUser != null) {

        if (tempUser.guilds.split("|").includes(member.guild.id + ""))
            return true;
        else {//The user exists, but not with a matching guild in the DB

            addGuild(member, tempUser)
            return true;
        }
    }
    else{
        console.log("The user doesnt exist.");
        createUser(member);
    }
    return false;
}

async function initialiseUsers(message) {

    let members = message.channel.guild.members;
    let newUsers = 0;
    let existingUsers = 0;

    members.cache.forEach(async member => {

        if (await (checkExistance(member))) {//User exists with a matching guild in the DB
            existingUsers++;
        }
        else {

            (await createUser(member));
            newUsers++;
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

async function play(message, serverQueue) {
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };

    if (!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
            dispatcher: null
        };
        queue.set(message.guild.id, queueConstruct);

        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id)
            return message.channel.send("There was an error playing! " + err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const Dispatcher = await serverQueue.connection.play(ytdl(song.url,
        {
            filter: "audioonly",
            highWaterMark: 1 << 25
        }))
        .on('end', () => {

        })
        .on('error', error => {
            console.log(error);
        })
        .on('finish', () => {

            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        })

    Dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.dispatcher = Dispatcher;
}


//
async function graphs() {

    let ch = message.channel;
    await ch.send("**= = = =**");
    for (question in questions) {

        await ch.send("**" + question.content + "**")
        let numReact = question.reactions.length;

    }
}

async function minuteCount() {
    countTalk();
}

setInterval(minuteCount, 60 * 1000);



//fix date checking as 0's don't get added necesrily
//or fix top by changing get date function
//Add exclude from pings and DM's
//coin flipper
//game decider
//View users signed up for a game
//add a purge my game list
//make remove game array - it is but broken
//backup DB?
//Add a 'summoner' top stat - most pings
//change prefix - store it in a guild model, or make a field for users - prob a user specific one
//roll command - for however many sided die
//ping-pong command
//create a json of commands for fuzzy search of commands - lmao
//when pinging an invalid game - suggest the first match along with the number
//Make an automated set-up in a person's DM that will walk them through how to add games, search their list,
//remove a game, set exclude status etc...(maybe be pinged of new features, or meme of the day, of suggested commands...


//Twitch notification/signup when a streamer goes live
//https://dev.twitch.tv/docs/api/reference/#get-streams
//add streamer stats
//seal idan easter eggs
//ping by number - if there is enough demand for it