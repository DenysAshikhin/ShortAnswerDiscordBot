const Discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const ytdl = require("ytdl-core");
//const ytdl = require('ytdl-core-discord');
const gameJSON = require('./gameslist.json');
const Commands = require('./commands.json');
const studyJSON = require('./medstudy.json');
const fs = require('fs');
const creatorID = '99615909085220864';
const botID = '689315272531902606';
const games = new Array();
const studyArray = new Array();
const GameTutorial = {
    expectedCommand: [
        Commands.commands[1],//"SEARCH"
        Commands.commands[2],//"SIGNUP"
        Commands.commands[2],//"SIGNUP"
        Commands.commands[3],//"MYGAMES"
        Commands.commands[4],//"REMOVEGAME"
        Commands.commands[13],//"PING"
        Commands.commands[5],//"EXCLUDEPING"
        Commands.commands[6]//"EXCLUDEDM"
    ],
    expectedOutput: [
        1,
        1,
        2,
        0,
        1,
        0,
        0,
        0
    ]
};
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


//FAT NOTE: (true >= false) is TRUE

var Client = new Discord.Client();
var config = null;
var queue = new Map();
var prefix = "sa!";
var uri = "";
var token = "";
try {
    config = require('./config.json');
}
catch (err) {

    console.log("config.json doesn't exist - probably running on heroku?");
}
if (config == null) {
    uri = process.env.URI;
    token = process.env.TOKEN;
}
else {
    uri = config.uri;
    token = config.token;
}
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const connectDB = mongoose.connection;

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

    Client.login(token);

    gameJSON.forEach(element => {

        //console.log(element.name.split(' ').join('_'));
        //games.push(element.name.split(' ').join('_').toUpperCase());
        games.push(element.name);
    });
    games.sort();


    studyJSON.forEach(element => {

        studyArray.push(element);
    });


    Client.on("ready", () => {

        console.log("Ready!");

        Client.user.setActivity("sa!help for information");

        updateAll();
    });

    Client.on("message", async (message) => {

        if (message.author.bot) return;

        let user = await findUser({ id: message.author.id });
        if (!user) {
            await checkExistance(member);
            user = await findUser({ id: member.id });
        }

        if (message.channel.type != 'dm')
            updateMessage(message, user);

        if (message.content.substr(0, prefix.length) == prefix) {

            let messageArray = message.content.split(' ');
            let command = messageArray[0];
            command = command.substr(prefix.length).toUpperCase();

            let params = message.content.substr(message.content.indexOf(' ') + 1).split(',');

            if (!params[0])
                params[0] = "";

            if (!Commands.commands.includes(command.toUpperCase())) {

                message.channel.send("**" + command + "** is not a recognized command, please try again");
                return;
            }

            if (user.activeTutorial != -1 && message.channel.type == 'dm') {//Intercepting tutorial commands in DM's

                switch (user.activeTutorial) {
                    case 0:

                        if (command == GameTutorial.expectedCommand[user.tutorialStep]) {

                            gameTutorial(message, params, command, user);
                            return;
                        }
                    case 1:

                        break;
                }
            }

            //Commands that work in both servers and DM's
            if (command == Commands.commands[0]) {

                for (i = 1; i <= params[0]; i++) {

                    await message.channel.send(i).then(sent => {

                        reactAnswers(sent);
                    });
                }
                message.delete();
            }//populate
            else if (command == Commands.commands[1]) //search
                search(message, params);
            else if (command == Commands.commands[2]) //signup
                await updateGames(message, params, user);
            else if (command == Commands.commands[3])//mygames
                personalGames(message, user);
            else if (command == Commands.commands[4]) //removeGame
                removeGame(message, params, user);
            else if (command == Commands.commands[5]) //excludePing
                excludePing(message, user);
            else if (command == Commands.commands[6]) //excludeDM
                excludeDM(message, user);
            else if (command == Commands.commands[7]) //help
                generalHelp(message, user);
            else if (command == Commands.commands[8]) //helpGames
                gameHelp(message);
            else if (command == Commands.commands[9]) //helpStats
                helpStats(message);
            else if (command == Commands.commands[10]) //helpMiscellaneous
                helpMiscellaneous(message);
            else if (command == Commands.commands[11]) //study//helpMusic
                helpMusic(message);
            else if (command == Commands.commands[12]) //study
                study(message, params);
            else if (command == Commands.commands[13]) //ping
                pingUsers(message, params);
            else if (command == Commands.commands[26])//suggest
                suggest(message, user)
            else if (command == Commands.commands[27])//notifyUpdate status
                setNotifyUpdate(message, user)
            else if (command == Commands.commands[28])//notifyTutorials
                setNotifyTutorials(message, user);
            else if (message.channel.type != 'dm') {//Server exclusive commands

                if (command == Commands.commands[14]) //initialiseUsers
                    initialiseUsers(message);
                else if (command == Commands.commands[15] && message.member.hasPermission("MANAGE_MESSAGES", { checkAdmin: false, checkOwner: false })) {

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
                }//delete
                else if (command == Commands.commands[16]) //myStats
                    personalStats(messageuser);
                else if (command == Commands.commands[17] && message.member.hasPermission("ADMINISTRATOR")) //allStats
                    guildStats(message);
                else if (command == Commands.commands[18]) //userStats
                    specificStats(message, params);
                else if (command == Commands.commands[19]) //topStats
                    topStats(message);
                else if (command == Commands.commands[20]) {//play
                    const serverQueue = queue.get(message.guild.id);
                    play(message, serverQueue);
                }
                else if (command == Commands.commands[21]) {//stop
                    queue.get(message.guild.id).voiceChannel.leave();
                    queue.delete(message.guild.id);
                }
                else if (command == Commands.commands[22]) {//pause
                    queue.get(message.guild.id).dispatcher.pause();
                }
                else if (command == Commands.commands[23]) {//resume
                    queue.get(message.guild.id).dispatcher.resume();
                }
                else if (command == Commands.commands[24]) {//skip
                    queue.get(message.guild.id).songs.shift();
                    playSong(message.guild, queue.get(message.guild.id).songs[0]);
                }
                else if (command == Commands.commands[25]) //gameTutorial
                    message.channel.send(`${prefix}gameTutorial is a DM exclusive command, try sending it me privately :wink:`);

            }//End of server text channel else/if chain
            else {

                if (command == Commands.commands[16]) //myStats
                    personalDMStats(message, user);
                else if (command == Commands.commands[25]) //gameTutorial
                    gameTutorial(message, params, command, user);
                else {
                    message.channel.send("The command: " + prefix + command + " is exclusive to server text channels. Please try the command in a server that I am present in!");
                }//End of DM else/if chain
            }
        }//End of checking for correct prefix
        user.save();
    });//End of Client.on('message')

    Client.on('guildMemberAdd', member => {

        if (member.guild.systemChannelID != null || member.guild.systemChannelID != undefined)
            member.guild.channels.cache.get(member.guild.systemChannelID).send("Welcome to the server " + member.displayName + "!");
        checkExistance(member);
    });

    Client.on('presenceUpdate', (oldMember, newMember) => {

        //console.log("hopefuly this traffic keeps it awake?");
    });
});





function suggest(message, user) {


}




// `Greetings!\nYou are getting this message because I noticed you haven't signed up for any games! If you would like to summon other players (friends)`
// + ` to play a game with you, be notified when someone else wants to play a game, manage your games list and more type **${prefix}gameTutorial**`
// + ` for a step-by-step walkthrough! However, if you would like to opt out of this and all future tutorials, type **${prefix}tutorials** *false*.`

async function gameTutorial(message, params, command, user) {

    //UPDATE ME AND SUGGEST NEEDS TO BE IMPLEMENTED
    let steps = [
        `Awesome, welcome to the game tutorial! let's start by searching for a game you play with others!\nDo so by typing **${prefix}search**  *nameOfGame*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[1] + " Counter Strike\n2) " + prefix + Commands.commands[1] + " Counter Strike, Minecrt```",
        `Now that you see a bunch of results, hopefully the game you wanted is towards the top, along with the associated number.`
        + ` To add this game to your games list type **${prefix}` + Commands.commands[2] + `** *game#*. You can alternatively signup by pasting the complete name of the game.`
        + "```Example(s):\n1) " + prefix + Commands.commands[2] + " 302\n2) " + prefix + Commands.commands[2] + " Counter-Strike: Global Offensive```"
        + ` Please add any valid (and new) game to your games list to continue`,
        `You can also sign up for as many games at once you would like by seperating each entry by a comma - you can mix both words and numbers for each entry as such:`
        + "```Example(s):\n1) " + prefix + Commands.commands[2] + " 2, Counter-Strike: Global Offensive, 24, Minecraft```"
        + ` Now it's your turn to sign up for more than one game at once, don't worry, I will show you how to remove any or all games in the following steps.`,
        `Now that we have some games tracked for you, let's view your complete game list by typing **${prefix}` + Commands.commands[3] + `**`
        + "```Example(s):\n1) " + prefix + Commands.commands[3] + "```",
        `Now try removing any of the games in your games list by typing **${prefix}` + Commands.commands[4] + `** *game#*.`
        + ` Just a heads up that the GAME# is the number from your games list.`
        + "```Example(s):\n1) " + prefix + Commands.commands[4] + " 1```",
        `Now if you want to play a game, but not sure who is up for it, you can simple type **${prefix}` + Commands.commands[13]
        + `** *nameOfGame* and anyone who has this game and the proper excludes`
        + ` will be notified. NOTE: "nameOfGame" has to be spelled perfectly but it does not have to be in your games list.`
        + "```Example(s):\n1) " + prefix + Commands.commands[13] + " Counter-Strike: Global Offensive```"
        + ` Go ahead, try out the command!`,
        `Almost done, now some quality of life, when someone pings a game, there will be two notifications for you, the first is`
        + ` an @mention in the text channel it was sent from. To disable @mentions simply type`
        + ` **${prefix}` + Commands.commands[5] + `** *true/false*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[5] + " false```Your turn!",
        `The second notification is a direct message. To disable direct messages from pings simply type`
        + ` **${prefix}` + Commands.commands[6] + `** *true/false*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[6] + " false```"
        + `To complete the walkthrough go ahead and try it out.`,
        `Congratulations! You have completed the game tutorial. As a reward, you can now offer feedback, suggestions or anything else to the creator by typing`
        + ` **${prefix}` + Commands.commands[26] + `** *any suggestion here* and I'll forward the message to the creator. For a more general help,`
        + ` type **${prefix}` + Commands.commands[7] + `**`
        + `\nAs a final note, this bot is being rapidly developed with new feautres constantly being added,`
        + ` if you would like to recieve a private message when a new feature is live, type **${prefix}` + Commands.commands[27] + `** *true/false*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[26] + " You should add game XYZ to the games list!\n2) " + prefix + Commands.commands[7]
        + "\n3) " + prefix + Commands.commands[27] + " true```"
    ]

    if (user.tutorialStep == -1) {

        message.channel.send(steps[0]);
        user.set('activeTutorial', 0);
        user.set('tutorialStep', 0);
        user.set('previousTutorialStep', 0);
    }//
    else {
        if (user.activeTutorial == 0 || user.activeTutorial == -1) {

            if (command == Commands.commands[25]) {
                message.channel.send(steps[user.tutorialStep]);
            }
            else if (user.tutorialStep - user.previousTutorialStep == 1) {//If the user completed a previous step succesfuly, give the new prompt

                if (user.tutorialStep != steps.length - 1) {

                    user.set("previousTutorialStep", user.previousTutorialStep + 1);
                    user.save();
                    message.channel.send(steps[user.tutorialStep]);
                }
                else {//Tutorial over!!!!!
                    //Need to add the recommend and something else commands
                    message.channel.send(steps[user.tutorialStep]);
                    user.set("activeTutorial", -1);
                    user.set("previousTutorialStep", -1);
                    user.set("tutorialStep", -1);
                    user.set("canSuggest", true);
                    if (!user.completedTutorials.includes(0))
                        user.completedTutorials.push(0);
                    user.save();
                }
            }
            else {//Test if their response is the correct one.

                if (command == GameTutorial.expectedCommand[user.tutorialStep]) {

                    switch (user.tutorialStep) {

                        case 0:
                            if (search(message, params) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 1:
                            if (await updateGames(message, params, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 2:
                            if (await updateGames(message, params, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 3:
                            if (personalGames(message, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 4:
                            if (removeGame(message, params, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 5:
                            if (await pingUsers(message, params) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 6:
                            if (excludePing(message, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                        case 7:
                            if (excludeDM(message, user) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                                user.set('tutorialStep', user.tutorialStep + 1);
                                user.save();
                                setTimeout(gameTutorial, 1000, message, params, command, user);
                            }
                            break;
                    }//End of switch

                }//If the command matched.
            }
        }
        else {
            message.channel.send(`You are already doing ${tutorial[user.activeTutorial]}, to quit it type **${prefix}quitTutorial**`);
        }
    }
}

function personalGames(message, user) {

    let games = user.games.split("|");
    let finalList = "";

    for (let i = 0; i < games.length; i++) {

        if (games[i].length > 1)
            finalList += i + ") " + games[i] + "\n";
    }

    let display = message.author.username;
    if (message.member != null)
        display = message.member.displayName;

    if (finalList.length > 2) {

        message.channel.send("```" + display + " here are the games you are signed up for: \n" +
            finalList + "```");
        return 1;
    }

    else
        message.channel.send("You are not signed up for any games.");

    return 0;

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

async function getStats(member, user) {

    if (!user)
        user = await findUser({ id: member.id });

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
        + "Whether you are excluded from pings: " + user.excludePing + "\n",
        + "Whether you are excluded from DMs: " + user.excludeDM + "\n";

    return stats;
}

function search(message, searches) {
    if (searches == undefined || searches == null || searches.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + Commands.commands[1] + " counter");
        return -1;
    }
    if (searches.length == 1 && (searches[0].toUpperCase() == (prefix.toUpperCase() + Commands.commands[1]))) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + Commands.commands[1] + " counter");
        return -1;
    }

    console.log(searches)

    let finalArray = new Array();

    searches.forEach(query => {

        if (query.length > 0) {

            message.channel.send(mention(message.author.id) + "! Here are the result for: " + query + "\n");
            finalArray = new Array();
            let finalList = "";
            let fuse = new Fuse(games, options);

            let result = fuse.search(query);

            for (let i = 0; i < result.length; i++) {

                if (finalList.length <= 500) {

                    finalList += result[i].refIndex + ") " + result[i].item + "\n";
                }
            }

            finalArray.push(finalList);

            for (let i = 0; i < finalArray.length; i++) {

                message.channel.send("```" + finalArray[i] + "```");
            }
        }

    });//Each query response

    if (finalArray.length > 0)
        return 1;
    return 0;
}

function study(message, query) {

    if (query == undefined || query == null || query.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + "gamesList counter");
        return -1;
    }

    let finalObject = new Array();

    studyArray.forEach(ppt => {

        ppt.slides.forEach(slide => {

            let tempObject = {
                items: [],
                refIndex: [],
                originalString: "",
                deckName: ppt.pptName
            }
            let index = finalObject.length;

            let slideArray = slide.split(" ");

            let options1 = {
                isCaseSensitive: false,
                findAllMatches: true,
                includeMatches: false,
                includeScore: true,
                useExtendedSearch: false,
                minMatchCharLength: query[0].length / 2,
                shouldSort: true,
                threshold: 0.125,
                location: 0,
                distance: 100,
                keys: [
                    "slides"
                ]
            };

            let fuse = new Fuse(slideArray, options1);
            let searchWords = query[0].split(" ");

            searchWords.forEach(searchWord => {

                let result = fuse.search(searchWord);

                result.forEach(found => {

                    if (finalObject[index] == undefined) {
                        finalObject.push(tempObject);
                        let itemString = found.item.charAt(0).toLowerCase() + found.item.slice(1);
                        itemString = itemString.replace(/[\r\n,.(){}:;`~!@#$%^&*-_=+|]+/g, " ").trim();
                        finalObject[index].items.push(itemString);
                        finalObject[index].refIndex.push(found.refIndex);
                        finalObject[index].originalString = slide;
                    }
                    else if (!finalObject[index].refIndex.includes(found.refIndex)) {

                        let itemString = found.item.charAt(0).toLowerCase() + found.item.slice(1);
                        itemString = itemString.replace(/[\r\n,.(){}:;`~!@#$%^&*-_=+|]+/g, " ").trim();
                        finalObject[index].items.push(itemString);
                        finalObject[index].refIndex.push(found.refIndex);
                    }
                });//result loop
            });//searchWords loops
        })//slide loop
    });//ppt loop

    let currentSlideDeck = "";

    let searchNumbers = finalObject.length;
    if (query[1] != null)
        if (Number(query[1]) > 0)
            searchNumbers = Number(query[1]);

    let minResults = -1;
    if (query[2] != null)
        minResults = query[2];

    let minUniqueResults = -1;
    if (query[3] != null) {

        minUniqueResults = query[3];
    };

    if (finalObject.length > 0) {

        finalObject.sort(function (a, b) { return b.items.length - a.items.length });

        for (let i = 0; i < searchNumbers; i++) {

            let uniqueItems = new Array();

            if (minUniqueResults != -1) {

                let setty = new Set(finalObject[i].items);
                uniqueItems = Array.from(setty);
            }

            if (minResults <= finalObject[i].items.length && minUniqueResults <= uniqueItems.length) {

                let tempy = finalObject[i].originalString.split(" ");

                if (currentSlideDeck != finalObject[i].deckName) {

                    message.channel.send("```Here the search results from slide deck: " + finalObject[i].deckName + "```\n");
                    currentSlideDeck = finalObject[i].deckName;
                }

                for (let j = 0; j < finalObject[i].items.length; j++) {
                    tempy[finalObject[i].refIndex[j]] = "__**" + tempy[finalObject[i].refIndex[j]] + "**__"
                }

                tempy = tempy.join(" ");
                message.channel.send(tempy)
                message.channel.send("===========================================");
            }
        }
        message.channel.send("```DONE!```");
    }
    else {
        message.channel.send("```Did not find any matches!```");
    }
}

function helpMiscellaneous(message) {

    let help =
        "Command 1: " + prefix + "delete [number]\n``` Deletes the last [number] of messages if you have the 'manage messages' permission.```\n"
        + "Command 2: " + prefix + "populate [number]\n```Creates [number] of questions numbered 1 - [number] with an reaction emoji for letters A-E.```\n"
    message.channel.send(help);
}

function helpStats(message) {

    let statsMessage =
        "Command 1: " + prefix + "myStats\n```Shows you all of your stats.```\n"
        + "Command 2: " + prefix + "userStats @User\n```Shows you the stats of the mentioned/pinged user.```\n"
        + "Command 3: " + prefix + "topStats\n```Shows the top stats for the called server.```\n"
        + "Command 4: " + prefix + "allStats\n```Shows the stats for all users on the called server. NOTE: Can only be called by the members with the ADMINSTRATOR permission.```"

    message.channel.send(statsMessage);
}

function helpMusic(message) {

    let musicMessage =
        "Command 1: " + prefix + "play [youtube url]\n```Plays the song in the url, if one is already playing, it will be added to the queue.```\n"
        + "Command 2: " + prefix + "stop\n```Empties the queue and makes the bot leave the voice channel.```\n"
        + "Command 3: " + prefix + "pause\n```Pauses the current song.```\n"
        + "Command 4: " + prefix + "resume\n```Resumes playing the current song.```\n"
        + "Command 5: " + prefix + "skip\n```Skips the current song.```"
    message.channel.send(musicMessage);
}

function generalHelp(message, user) {

    if (!user.completedTutorials.includes(0)) {

        let tutorialPrompt = `I noticed you haven't signed up for any games! If you would like to summon other players (friends)`
            + ` to play a game with you, be notified when someone else wants to play a game, manage your games list and more type **${prefix}gameTutorial**`
            + ` for a step-by-step walkthrough! However, if you would like to opt out of this and all future tutorials, type **${prefix}tutorials** *false*.\n\n`
        message.channel.send(tutorialPrompt);
    }

    let helpMessage = "The following commands are broken down into 4 general sections: Games, Stats, Miscellaneous, and Music. Enter: \n"
        + "```" + "1) " + prefix + "helpGames  || For information on how signUp for games, how to ping games, search for a game and more.\n\n"
        + "2) " + prefix + "helpStats  || For information on how to view server, personal, top stats and more.\n\n"
        + "3) " + prefix + "helpMiscellaneous  || For information on random commands.\n\n"
        + "4) " + prefix + "helpMusic || For information on playing music.\n\n"
        + "IMPORTANT: Make sure to run " + prefix + "initiliaseUsers || otherwise the other commands will not function properly. This command adds all users from the called server to the bot's tracker.\n\n"
        + "```";

    message.channel.send(helpMessage);
}

function gameHelp(message) {

    let gameMessage =
        "Command 1: " + prefix + "signUp [game1], [game2], [game3]...\n```Signs you up to be summoned when someone pings any of the [games] in your games list. "
        + "You can either write the full game title or the associated number.\n\n"
        + "Example usage: " + prefix + "signUp Counter-Strike: Global Offensive, 212, Minecraft...\n\nWill add three games to your gamesList.```\n"

        + "Command 2: " + prefix + "myGames\n```Show you your games list, if anyone pings a game on your games list, you will get notified.```\n"

        + "Command 3: " + prefix + "removeGame [game] \n```Removes [game] from your game list.\n\n"
        + "Example usage: " + prefix + "removeGame 2 |OR| " + prefix + "removeGame Counter-Strike: Global Offensive\n\nWill remove the game specified by the number "
        + "(which as to correspond to a game in your gamesList) or search your gamesList for the title of the game you wish to remove.```\n"

        + "Command 4: " + prefix + "excludePing [true/false] \n```Sets whether you wish to be @mentioned when someone pings a game to play. If set to 'true', you will be excluded from all pings "
        + "and vice versa.\nExample usage: " + prefix + "exclude true |OR| " + prefix + "exclude false```\n"

        + "Command 5: " + prefix + "excludeDM [true/false] \n```Sets whether you wish to receive a direct message when someone pings a game to play. If set to 'true', you will be excluded from all pings "
        + "and vice versa.\nExample usage: " + prefix + "exclude true |OR| " + prefix + "exclude false```\n"

        + "Command 6: " + prefix + "search [game1], [game2].... \n```Searches all the complete game list for the speicified games you wish to find. You can search for as many games as desired, seperated by a comma.\n"
        + "Example usage: " + prefix + "search Counter, Overwatch, League```\n"

        + "Command 7: " + prefix + "ping [game] \n```Pings and DM's every member from the called server who have [game] in their games list and do not have the exclude status enabled.\n"
        + "Example usage: " + prefix + "ping Counter-Global: Offensive```";

    message.channel.send(gameMessage);
}

function personalStats(message, user) {

    message.channel.send(mention(message.member.id) + " here are your stats: ```"
        + getStats(user) + "```");
}

function personalDMStats(message, user) {

    let guilds = user.guilds.split("|");

    message.channel.send("Here are your general stats:");

    let generalStats = "```"
        + "The games you are signed up for: " + user.games + "\n"
        + "Whether you are excluded from pings: " + user.excludePing + "\n"
        + "Whether you are excluded from DMs: " + user.excludeDM + "```";

    message.channel.send(generalStats);

    for (let i = 0; i < guilds.length; i++) {

        if (guilds[i].length > 2) {
            let stats = "";
            message.channel.send("Here are the stats for the server: " + message.client.guilds.cache.get(guilds[i]).name + "")
            stats = "```Total number of messages sent: " + user.messages.split("|")[i] + "\n"
                + "Last message sent: " + user.lastMessage.split("|")[i] + "\n"
                + "Total time spent talking (in minutes): " + user.timeTalked.split("|")[i] + "\n"
                + "Last time you talked was: " + user.lastTalked.split("|")[i] + "\n"
                + "Time spent AFK (in minutes): " + user.timeAFK.split("|")[i] + "\n"
                + "You joined this server on: " + user.dateJoined.split("|")[i] + "```";
            message.channel.send(stats);
        }
    }
}

async function guildStats(message) {

    let memberArray = message.guild.members.cache.array();

    for (let i = 0; i < memberArray.length; i++) {

        await message.channel.send("Here are the stats for " + memberArray[i].displayName + ": ```"
            + (await getStats(memberArray[i])) + "```");
    }

    message.channel.send("```DONE!```");
}

async function countTalk() {

    Client.guilds.cache.forEach(async guild => {

        guild.channels.cache.forEach(async channel => {

            if (channel.type == "voice") {

                channel.members.forEach(async member => {

                    let user = await findUser({ id: member.id });
                    if (!user) {
                        console.log("found the null user: " + member.displayName + " || From: " + guild.name);
                        await checkExistance(member);
                        user = await findUser({ id: member.id });
                    }
                    let guilds = user.guilds.split("|");
                    let index = guilds.indexOf(guild.id);

                    if (channel.id == guild.afkChannelID) {

                        let timeAFK = user.timeAFK.split("|");
                        timeAFK[index] = (Number(timeAFK[index]) + 1).toString();

                        User.findOneAndUpdate({ id: member.id },
                            {
                                $set: { timeAFK: timeAFK.join("|") }
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
                                $set: { timeTalked: timeTalked.join("|"), lastTalked: lastTalked.join("|") }
                            }, function (err, doc, res) {
                                //console.log(doc);
                            });
                    }
                })
            }
        })
    })
}

async function updateMessage(message, user) {

    let messages = user.messages.split("|");
    let lastMessage = user.lastMessage.split("|");
    let guilds = user.guilds.split("|");
    let index = guilds.indexOf(message.guild.id);

    messages[index] = Number(messages[index]) + 1 + "";
    lastMessage[index] = getDate();

    user.set('messages', messages.join("|"));
    user.set('lastMessage', lastMessage.join("|"));
}

function excludePing(message, user) {

    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == undefined) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
        return -1;
    }

    if (bool == "TRUE") {

        user.set('excludePing', true);
        message.channel.send(mention(message.author.id) + " will be excluded from any further pings.");
        return 1;
    }
    else if (bool == "FALSE") {

        user.set('excludePing', false);
        message.channel.send(mention(message.author.id) + " can now be pinged once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
        return -1;
    }
}

function excludeDM(message, user) {

    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == undefined) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }

    if (bool == "TRUE") {

        user.set('excludeDM', true);
        message.channel.send(mention(message.author.id) + " will be excluded from any further DMs.");
        return 1;
    }
    else if (bool == "FALSE") {

        user.set('excludeDM', false);
        message.channel.send(mention(message.author.id) + " will be DM'ed once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }
}

function setNotifyUpdate(message, user) {

    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == undefined) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[30] + "** *true/false*");
        return -1;
    }

    if (bool == "TRUE") {

        user.set('notifyUpdate', true);
        message.channel.send(mention(message.author.id) + " will be notified of new feature releases.");
        return 1;
    }
    else if (bool == "FALSE") {

        user.set('notifyUpdate', false);
        message.channel.send(mention(message.author.id) + " will be excluded from any new feature releases.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[30] + "** *true/false*");
        return -1;
    }
}

function setNotifyTutorials(message, user){

    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == undefined) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[31] + "** *true/false*");
        return -1;
    }

    if (bool == "TRUE") {

        user.set('notifyTutorial', true);
        message.channel.send(mention(message.author.id) + " will be notified of new/incomplete tutorials.");
        return 1;
    }
    else if (bool == "FALSE") {

        user.set('notifyTutorial', false);
        message.channel.send(mention(message.author.id) + " will be excluded from any new/incomplete tutorials.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[31] + "** *true/false*");
        return -1;
    }
}

function getDate() {

    let today = new Date();
    let dayNumber = "00";
    if (today.getUTCDate() < 10)
        dayNumber = "0" + today.getUTCDate();
    else
        dayNumber = today.getUTCDate();

    let monthNumber = "00";
    if ((Number(today.getMonth()) + 1) < 10)
        monthNumber = "0" + (Number(today.getMonth()) + 1);
    else
        monthNumber = Number(today.getMonth()) + 1;

    return dayNumber + "-" + monthNumber + "-" + today.getFullYear();
}

function removeGame(message, game, user) {

    let gameArr = user.games.split("|");
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


    user.set('games', finalGameList);
    let returnString = removedGames.split("|");
    console.log("AAAAAA: " + returnString);
    if (returnString[0].length > 1)
        return returnString.length - 1;
    else
        return 0;
}

function mention(id) {
    return "<@" + id + ">"
}

function directMessage(message, memberID, game) {

    message.guild.members.cache.get(memberID).user.send(message.member.displayName + " has summoned you for " + game + " in "
        + message.guild.name + "!");
}

async function pingUsers(message, game) {//Return 0 if it was inside a DM

    game = game[0].trim();
    if (!isNaN(game)) {

        if (game < 0 || game >= games.length)
            message.channel.send(game + " is not assigned to any games, please try again or type " + prefix + "search to view the list of all games.");
        return -1;
    }
    else if (!games.includes(game)) {
        message.channel.send(game + " is not a valid game, please try again or type " + prefix + "search to view the list of all games.");
        return -1;
    }
    else if (message.channel.type == 'dm') {

        await message.channel.send(message.author.username + " has summoned " + mention(botID) + " for some " + game);
        await message.channel.send("Unfortunately I cannot play games, why not try the same command inside a server?");
        return 0;
    }

    let users = await getUsers();
    let signedUp = "";
    let defaulted = "";

    users.forEach(async user => {
        //  console.log(user.displayName + "||" + user.exclude);
        if (user.id != message.member.id) {

            if (user.guilds.split("|").includes(message.guild.id)) {

                if (isNaN(game)) {

                    if (user.games.split("|").includes(game)) {

                        if (user.excludePing == false)
                            signedUp += mention(user.id);
                        if (user.excludeDM == false)
                            directMessage(message, user.id, game);
                    }
                }
                else if (user.games.split("|").includes(games[game])) {

                    if (user.excludePing == false)
                        signedUp += mention(user.id);
                    if (user.excludeDM == false)
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
    return 1;
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
        excludePing: false,
        excludeDM: false,
        guilds: member.guild.id + "|",
        activeTutorial: -1,
        tutorialStep: -1,
        previousTutorialStep: -1,
        notifyUpdate: false,
        notifyTutorial: true,
        completedTutorials: []
    }

    let userModel = new User(newUser);
    await userModel.save(function (err, user) {

        if (err) return console.error(err)
    });
}
//I was here
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

async function updateGames(message, game, user) {

    let setty = new Set(game);
    game = Array.from(setty);
    games.sort();
    let existingGames = user.games.split("|");
    let finalString = "";
    let alreadyTracked = "";
    let invalidGames = "";

    for (let i = 0; i < game.length; i++) {
        gameTitle = game[i];

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
    }

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

    user.set('games', user.games + finalString);
    let returnString = finalString.split("|");
    if (returnString[0].length > 1)
        return returnString.length - 1;
    else
        return 0;
}

async function checkExistance(member) {

    let tempUser = await findUser({ id: member.id })
    if (tempUser != null) {

        if (tempUser.guilds.split("|").includes(member.guild.id + ""))
            return true;
        else {//The user exists, but not with a matching guild in the DB

            await addGuild(member, tempUser)
            return true;
        }
    }
    else {
        console.log("The user doesnt exist.");
        await createUser(member);
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
    message.channel.send("The server's users are now tracked!");
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


async function graphs() {

    let ch = message.channel;
    await ch.send("**= = = =**");
    for (question in questions) {

        await ch.send("**" + question.content + "**")
        let numReact = question.reactions.length;

    }
}

async function updateAll() {




    // let users = await getUsers();

    // users.forEach(async user => {

    // let changed = await User.findOneAndUpdate({ id: user.id },
    //     {
    //         $set: {
    //             canSuggest: false
    //         }
    //     }, { new: true });

    //  user.set('notifyUpdate', true );
    //  user.save();
    // });//each user loop

    // console.log("CALLED UPDATE ALL");
}

async function minuteCount() {
    countTalk();
}

setInterval(minuteCount, 60 * 1000);


//When making a DB backup, go over every possible value and check if it exists or not...

//Add pinging second parameter, for time offset, like in 30 mins?
//DM quality of life 
//Custom, per-user prefix

//coin flipper
//game decider
//View users signed up for a game
//add a purge my game list
//make remove game array - it is but broken
//Add a 'summoner' top stat - most pings
//change prefix - store it in a guild model, or make a field for users - prob a user specific one
//roll command - for however many sided die
//ping-pong command
//create a json of commands for fuzzy search of commands - lmao
//when pinging an invalid game - suggest the first match along with the number
//Make an automated set-up in a person's DM that will walk them through how to add games, search their list,
//remove a game, set exclude status etc...(maybe be pinged of new features, or meme of the day, of suggested commands...
//add a timer


//Twitch notification/signup when a streamer goes live
//https://dev.twitch.tv/docs/api/reference/#get-streams
//add streamer stats
//seal idan easter eggs
//ping by number - if there is enough demand for it




                // if (command.startsWith("emptyDB") && (message.author.id == creatorID)) {

                //     User.deleteMany({}, function (err, users) {

                //         console.log(err);
                //         console.log(JSON.stringify(users) + " deleted from DB");
                //     })
                //     return;
                // }