const Discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const Guild = require('./Guild.js')
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const ytdl = require("ytdl-core");
//const ytdl = require('ytdl-core-discord');
const gameJSON = require('./gameslist.json');
const Commands = require('./commands.json');
const studyJSON = require('./medstudy.json');
const DATABASE = require('./backups/26-04-2020.json');

const fs = require('fs');
const creatorID = '99615909085220864';
const botID = '689315272531902606';
const guildID = '97354142502092800';
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
    specificCommand: [
        search,
        updateGames,
        updateGames,
        personalGames,
        removeGame,
        pingUsers,
        excludePing,
        excludeDM
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
var commandMap = new Map();
var commandTracker = new Map();
var config = null;
var queue = new Map();
var defaultPrefix = "sa!";
var prefix;
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

const findGuild = async function (params) {
    try {
        return await Guild.findOne(params)
    } catch (err) { console.log(err) }
}

connectDB.once('open', async function () {

    await Client.login(token);

    updateAll()
    populateCommandMap();

    for (let element of gameJSON)
        games.push(element.name);
    games.sort();

    for (let element of studyJSON)
        studyArray.push(element);

    Client.on("ready", () => {

        console.log("Ready!");

        Client.user.setActivity("sa!help for information");
    });

    Client.on("message", async (message) => {
        if (message.author.bot) return;

        let user = await findUser({ id: message.author.id });


        if (message.channel.type != 'dm') {

            let guild = await findGuild({ id: message.guild.id });
            if (!user || !user.guilds.includes(message.guild.id)) {//Checking that the user exists in DB and they have a valid guild
                await checkExistance(message.member);
                user = await findUser({ id: message.member.id });
            }
            updateMessage(message, user);

            let index = user.guilds.indexOf(message.guild.id);
            if (user.prefix[index] != "-1") prefix = user.prefix[index];
            else if (guild.prefix != "-1") prefix = guild.prefix;
            else if (user.defaultPrefix != "-1") prefix = user.defaultPrefix;
            else prefix = defaultPrefix;

        }
        else if (!user) {//Only happens if a user that is not in the DB DM's the bot...not sure how but hey, you never know?
            message.channel.send("You don't seem to be in my DataBase, perhaps try joining a server I am in and then sending the command again?")
            return;
        }
        else {
            if (user.defaultPrefix != "-1") prefix = user.defaultPrefix;
            else prefix = defaultPrefix;
        }

        console.log(`FINAL PREFIX: ${prefix}`);
        if (message.content.substr(0, prefix.length) == prefix) {

            let command = message.content.split(' ')[0].substr(prefix.length).toUpperCase();
            let params = message.content.substr(message.content.indexOf(' ') + 1).split(',');

            if (!params[0])
                params[0] = "";

            commandMatcher(message, command, params, user);
            return;
        } else {//Command tracker stuff
            triggerCommandHandler(message, user, false);
        }
    });

    Client.on('guildMemberAdd', member => {

        if (member.id == botID) {
            console.log("bot joined server!");
        }
        else if (member.guild.systemChannelID)
            member.guild.channels.cache.get(member.guild.systemChannelID).send("Welcome to the server " + member.displayName + "!");
        checkExistance(member);
    });

    Client.on('guildMemberRemove', async member => {

        if (member.id != botID) {
            let user = await findUser({ id: member.id });
            let index = user.guilds.indexOf(member.guild.id);
            user.kicked[index] = true;
            User.findOneAndUpdate({ id: member.id }, { $set: { kicked: user.kicked } }, function (err, doc, res) { });
        }
    });

    Client.on('presenceUpdate', (oldMember, newMember) => {

        //console.log("hopefuly this traffic keeps it awake?");
    });//

    Client.on("guildCreate", async guild => {

        let searchedGuild = await findGuild({ id: guild.id });
        if (!searchedGuild) createGuild(guild);
    })

    Client.on("guildDelete", async guild => {

        console.log(`Bot has been kicked from ${guild.name}`);
    })
});

function populateCommandMap() {

    commandMap.set(Commands.commands[0], populate)
    commandMap.set(Commands.commands[1], search)
    commandMap.set(Commands.commands[2], updateGames)
    commandMap.set(Commands.commands[3], personalGames)
    commandMap.set(Commands.commands[4], removeGame)
    commandMap.set(Commands.commands[5], excludePing)
    commandMap.set(Commands.commands[6], excludeDM)
    commandMap.set(Commands.commands[7], generalHelp)
    commandMap.set(Commands.commands[8], gameHelp)
    commandMap.set(Commands.commands[9], helpStats)
    commandMap.set(Commands.commands[10], helpMiscellaneous)
    commandMap.set(Commands.commands[11], helpMusic)
    commandMap.set(Commands.commands[12], study)
    commandMap.set(Commands.commands[13], pingUsers)
    commandMap.set(Commands.commands[14], initialiseUsers)
    commandMap.set(Commands.commands[15], Delete)
    commandMap.set(Commands.commands[16], personalStats)
    commandMap.set(Commands.commands[17], guildStats)
    commandMap.set(Commands.commands[18], specificStats)
    commandMap.set(Commands.commands[19], topStats)
    commandMap.set(Commands.commands[20], play)
    commandMap.set(Commands.commands[21], stop)
    commandMap.set(Commands.commands[22], pause)
    commandMap.set(Commands.commands[23], resume)
    commandMap.set(Commands.commands[24], skip)
    commandMap.set(Commands.commands[25], gameTutorial)
    commandMap.set(Commands.commands[26], suggest)
    commandMap.set(Commands.commands[27], setNotifyUpdate)
    commandMap.set(Commands.commands[28], setNotifyTutorials)
    commandMap.set(Commands.commands[29], quitTutorial)
    commandMap.set(Commands.commands[30], purgeGamesList)
    commandMap.set(Commands.commands[31], gameStats)
    commandMap.set(Commands.commands[32], topGames)
    commandMap.set(Commands.commands[33], setServerPrefix)
    commandMap.set(Commands.commands[34], setDefaultPrefix)
    commandMap.set(Commands.commands[35], setDefaultServerPrefix)
}

function setServerPrefix(message, params, user) {

    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    let index = user.guilds.indexOf(message.guild.id);
    user.prefix[index] = params;

    message.channel.send(`Your new prefix for this server is: "${params}"`);

    User.findOneAndUpdate({ id: user.id }, { $set: { prefix: user.prefix } }, function (err, doc, res) { });
    return 1;
}

function setDefaultServerPrefix(message, params, user) {

    if(message.channel.type == 'dm') return message.channel.send("You can only set the default server prefix from inside a server text channel");
    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    let index = user.guilds.indexOf(message.guild.id);
    user.prefix[index] = params;

    message.channel.send(`This server's default prefix is: "${params}"`);

    Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { prefix: params } }, function (err, doc, res) { });
    return 1;
}


function setDefaultPrefix(message, params, user) {

    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    message.channel.send(`Your new base (default) prefix is: "${params}"`);

    User.findOneAndUpdate({ id: user.id }, { $set: { defaultPrefix: params } }, function (err, doc, res) { });
    return 1;
}

async function triggerCommandHandler(message, user, skipSearch) {

    if (commandTracker.get(message.author.id)) {

        if (message.content == -1) return commandTracker.delete(message.author.id);

        let result = await handleCommandTracker(commandTracker.get(message.author.id), message, user, skipSearch);
        if (result == 1) {
            commandTracker.delete(message.author.id);
        }
        return result;
    }
}

async function commandMatcher(message, command, params, user) {

    let check = await checkCommands(command);

    if (check == -1) {
        message.channel.send(`${command} did not resemble any command I know of, try again?`);
        return -1;
    }
    else if (check.result[0].score != 0) {
        message.channel.send(`${command} is not a valid command, if you meant one of the following, simply type the **number** you wish to use:` + "```" + check.prettyList + "```");
        specificCommandCreator(commandMatcher, [message, -1, params, user], check.result, user);
        return -11;
    }
    else {
        specificCommandCreator(commandMap.get(check.result[0].item), [message, params, user], null, user);
        return await triggerCommandHandler(message, user, true);
    }
}

//-1 invalid input, 0 don't delete (passed to command matcher) - need it next time, 1 handled, delete
async function handleCommandTracker(specificCommand, message, user, skipSearch) {

    let params = message.content;
    if (!skipSearch) {
        if (!isNaN(params) && params.length > 0) {
            params = Math.floor(params);
            if (params >= specificCommand.choices.length || params < 0)
                return -1;

            for (let i = 0; i < specificCommand.defaults.length; i++) {

                if (specificCommand.defaults[i] == -1)
                    specificCommand.defaults[i] = specificCommand.choices[Math.floor(params)].item
            }
            if (await tutorialHandler(message, specificCommand.command, specificCommand.choices[Math.floor(params)].item, user))
                return 1;
        }
    }
    else {
        if (await tutorialHandler(message, specificCommand.command, params, user))
            return 1;
    }

    let finishy = await specificCommand.command.apply(null, specificCommand.defaults);

    if (finishy == -11 || finishy == 0)
        return 0;
    else {
        console.log("BOTTOM ELSE?")
        return 1;
    }
}

function specificCommandCreator(command, defaults, choices, user) {

    commandTracker.set(user.id, {
        command: command,
        defaults: defaults,
        choices: choices
    });
}

async function checkCommands(params, user) {

    if (!isNaN(params)) {
        return -1;
    }
    else if (Array.isArray(params)) {
        params = params[0].trim();
    }
    else {
        params = params.trim();
    }

    let finalArray = new Array();
    let finalList = "";
    let newOptions = {
        ...options,
        minMatchCharLength: params.length / 2,
        findAllMatches: false,
        includeScore: true,
    }
    //
    let fuse = new Fuse(Commands.commands, newOptions);
    let result = fuse.search(params);
    let maxResults = 5;
    if (maxResults > result.length)
        maxResults = result.length;

    for (let i = 0; i < maxResults; i++) {

        finalList += i + ") " + result[i].item + "\n";
        finalArray.push(result[i]);
    }

    let completeCheck = {
        result: finalArray,
        prettyList: finalList
    };

    if (finalArray.length > 0)
        return completeCheck;
    else return -1
}

async function Delete(message, params) {

    if (message.channel.type == 'dm') return -1;

    if (!message.channel.permissionsFor(message.member).has("MANAGE_MESSAGES"))
        return message.channel.send("You do not have the required permissions to delete messages!")


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

async function populate(message, params) {
    for (i = 1; i <= params[0]; i++) {

        await message.channel.send(i).then(sent => {

            reactAnswers(sent);
        });
    }
    message.delete();
}

function suggest(message, params, user) {

    if (params == message.content) {
        return message.channel.send("You have to provide an actual suggestion!");
    }
    Client.guilds.cache.get(guildID).members.cache.get(creatorID).user.send(`${user.displayName} is suggesting: ${params}`);
}

function quitTutorial(message, params, user) {

    User.findOneAndUpdate({ id: user.id },
        {
            $set: {

                activeTutorial: -1,
                tutorialStep: -1,
                previousTutorialStep: -1
            }
        }, function (err, doc, res) {
            if (err) console.trace(err)
            if (res) console.trace(res)
        });
    message.channel.send("You have quit the previous tutorial and may begin a new one at any point!");
}

function purgeGamesList(message, params, user) {

    User.findOneAndUpdate({ id: user.id },
        {
            $set: {
                games: []
            }
        }, function (err, doc, res) {
            //console.log(doc);
        });
    message.channel.send("You games list has been emptied!");
    return 1;
}

async function tutorialHandler(message, command, params, user) {

    if (user.activeTutorial != -1 && message.channel.type == 'dm') {//Intercepting tutorial commands in DM's
        switch (user.activeTutorial) {
            case 0:

                if (command == GameTutorial.specificCommand[user.tutorialStep]) {
                    gameTutorial(message, params, command);
                    return true;
                }
            case 1:

                break;
        }
    }
    return false;
}

// `Greetings!\nYou are getting this message because I noticed you haven't signed up for any games! If you would like to summon other players (friends)`
// + ` to play a game with you, be notified when someone else wants to play a game, manage your games list and more type **${prefix}gameTutorial**`
// + ` for a step-by-step walkthrough! However, if you would like to opt out of this and all future tutorials, type **${prefix}tutorials** *false*.`

async function gameTutorial(message, params, command) {

    //UPDATE ME AND SUGGEST NEEDS TO BE IMPLEMENTED
    let steps = [
        `Awesome, welcome to the game tutorial! let's start by searching for a game you play with others!\nDo so by typing **${prefix}search**  *nameOfGame*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[1] + " Counter Strike\n2) " + prefix + Commands.commands[1] + " Counter Strike, Minecrt```",
        `Now that you see a bunch of results, hopefully the game you wanted is towards the top, along with the associated number.`
        + ` To add this game to your games list type **${prefix}` + Commands.commands[2] + `** *game#*. You can alternatively signup by pasting the complete name of the game.`
        + "```Example(s):\n1) " + prefix + Commands.commands[2] + " 302\n2) " + prefix + Commands.commands[2] + " Counter-Strike: Global Offensive```"
        + ` Please add any valid (and new) game to your games list to continue`,
        `You can also sign up for as many games at once as you would like by seperating each entry by a comma - you can mix both words and numbers for each entry as such:`
        + "```Example(s):\n1) " + prefix + Commands.commands[2] + " 2, Counter-Strike: Global Offensive, 24, Minecraft```"
        + ` Now it's your turn to sign up for *at least two new games* at once, don't worry, I will show you how to remove any or all games in the following steps.`,
        `Now that we have some games tracked for you, let's view your complete game list by typing **${prefix}` + Commands.commands[3] + `**`
        + "```Example(s):\n1) " + prefix + Commands.commands[3] + "```",
        `Now try removing any of the games in your games list by typing **${prefix}` + Commands.commands[4] + `** *game#*.`
        + ` Just a heads up that the GAME# is the number from your games list.`
        + "```Example(s):\n1) " + prefix + Commands.commands[4] + " 1```",
        `Now if you want to play a game, but not sure who is up for it, you can simple type **${prefix}` + Commands.commands[13]
        + `** *nameOfGame*/*#ofGame* and anyone who has this game and the proper excludes`
        + ` will be notified. NOTE: "nameOfGame" has to be spelled perfectly but it does not have to be in your games list.`
        + "```Example(s):\n1) " + prefix + Commands.commands[13] + " Counter-Strike: Global Offensive\n2) " + prefix + Commands.commands[13] + " 0" + "```"
        + ` Go ahead, try out the command!`,
        `Almost done, now some quality of life, when someone pings a game there will be two notifications for you, the first is`
        + ` an @mention in the text channel it was sent from. To disable @mentions simply type`
        + ` **${prefix}` + Commands.commands[5] + `** *true/false*. *False* = you will be pinged, *True* = you will not be pinged.`
        + "```Example(s):\n1) " + prefix + Commands.commands[5] + " false```Your turn!",
        `The second notification is a direct message. To disable direct messages from pings simply type`
        + ` **${prefix}` + Commands.commands[6] + `** *true/false*. *False* = you will be DMed, *True* = you will not be DMed.`
        + "```Example(s):\n1) " + prefix + Commands.commands[6] + " false```"
        + `To complete the walkthrough go ahead and try it out.`,
        `Congratulations! You have completed the game tutorial. As a reward, you can now offer feedback, suggestions or anything else to the creator by typing`
        + ` **${prefix}` + Commands.commands[26] + `** *any suggestion here* and I'll forward the message to the creator. For a more general help,`
        + ` type **${prefix}` + Commands.commands[7] + `**`
        + `\nAs a final note, this bot is being rapidly developed with new features constantly being added,`
        + ` if you would like to recieve a private message when a new feature is live, type **${prefix}` + Commands.commands[27] + `** *true/false*.`
        + "```Example(s):\n1) " + prefix + Commands.commands[26] + " You should add game XYZ to the games list!\n2) " + prefix + Commands.commands[7]
        + "\n3) " + prefix + Commands.commands[27] + " true```"
    ]

    let user = await findUser({ id: message.author.id });

    if (user.tutorialStep == -1) {

        message.channel.send(steps[0]);
        await User.findOneAndUpdate({ id: user.id },
            {
                $set: {
                    activeTutorial: 0,
                    tutorialStep: 0,
                    previousTutorialStep: 0
                }
            }, function (err, doc, res) { });
    }//
    else {
        if (user.activeTutorial == 0 || user.activeTutorial == -1) {

            if (command == Commands.commands[25])
                message.channel.send(steps[user.tutorialStep]);
            else if (user.tutorialStep - user.previousTutorialStep == 1) {//If the user completed a previous step succesfuly, give the new prompt

                if (user.tutorialStep != steps.length - 1) {

                    message.channel.send(steps[user.tutorialStep]);

                    await User.findOneAndUpdate({ id: user.id },
                        {
                            $set: {
                                previousTutorialStep: user.previousTutorialStep + 1,
                            }
                        }, function (err, doc, res) { });
                }
                else {//Tutorial over!!!!!
                    //Need to add the recommend and something else commands
                    message.channel.send(steps[user.tutorialStep]);
                    if (!user.completedTutorials.includes(0)) {
                        user.completedTutorials.push(0);
                    }
                    await User.findOneAndUpdate({ id: user.id },
                        {
                            $set: {
                                activeTutorial: -1,
                                previousTutorialStep: -1,
                                tutorialStep: -1,
                                canSuggest: true,
                                completedTutorials: user.completedTutorials

                            }
                        }, function (err, doc, res) { });
                }
            }
            else {//Test if their response is the correct one.

                if (command == GameTutorial.specificCommand[user.tutorialStep]) {

                    if ((await GameTutorial.specificCommand[user.tutorialStep].call(null, message, params, user)) >= GameTutorial.expectedOutput[user.tutorialStep]) {
                        User.findOneAndUpdate({ id: user.id }, { $set: { tutorialStep: user.tutorialStep + 1 } }, function (err, doc, res) { });
                        setTimeout(gameTutorial, 1000, message, params, command);
                    }
                }
            }
        }
        else {
            message.channel.send(`You are already doing ${tutorial[user.activeTutorial]}, to quit it type **${prefix}quitTutorial**`);
        }
    }
}

async function personalGames(message, params, user) {

    if (!user.games)
        user = await findUser({ id: message.author.id })
    let games = user.games;
    let finalList = "";

    for (let i = 0; i < games.length; i++)
        finalList += i + ") " + games[i] + "\n";


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
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    let allUsers = await getUsers();
    let guild = message.guild;
    let silentType;
    let silentTypeIndex;

    let loudMouth;
    let loudMouthIndex;

    let ghost;
    let ghostIndex;

    let MIA;
    let MIAIndex;

    let summoner;
    let summonerIndex;

    let user = null;

    for (let i = 0; i < allUsers.length; i++) {

        if (allUsers[i].guilds.includes(guild.id)) {
            user = allUsers[i];
            let userIndex = user.guilds.indexOf(guild.id);

            if (!user.kicked[userIndex]) {
                if (!silentType) {
                    silentType = user;
                    silentTypeIndex = user.guilds.indexOf(guild.id);
                }
                if (!loudMouth) {
                    loudMouth = user;
                    loudMouthIndex = user.guilds.indexOf(guild.id);
                }
                if (!ghost) {
                    ghost = user;
                    ghostIndex = user.guilds.indexOf(guild.id);
                }
                if (!MIA) {
                    MIA = user;
                    MIAIndex = user.guilds.indexOf(guild.id);
                }
                if (!summoner) {
                    summoner = user;
                    summonerIndex = user.guilds.indexOf(guild.id);
                }

                if (Number(silentType.messages[silentTypeIndex]) < Number(user.messages[userIndex])) {
                    silentType = user;
                    silentTypeIndex = userIndex;
                }

                if (Number(loudMouth.timeTalked[loudMouthIndex]) < Number(user.timeTalked[userIndex])) {
                    loudMouth = user;
                    loudMouthIndex = userIndex;
                }

                if (Number(ghost.timeAFK[ghostIndex]) < Number(user.timeAFK[userIndex])) {
                    ghost = user;
                    ghostIndex = userIndex;
                }

                if (summoner.summoner[summonerIndex] < user.summoner[userIndex]) {
                    summoner = user;
                    summonerIndex = userIndex;
                }

                let userDate = findFurthestDate(user.lastMessage[userIndex], user.lastTalked[userIndex]);
                let MIADate = findFurthestDate(MIA.lastMessage[MIAIndex], MIA.lastTalked[MIAIndex]);


                if (userDate == findFurthestDate(userDate, MIADate)) {
                    MIA = user;
                    MIAIndex = userIndex;
                }
            }
        }
    }

    let index = user.guilds.indexOf(guild.id);

    message.channel.send("Here are the tops stats for this server: \n```" + "The silent type: " + silentType.displayName + " : "
        + silentType.messages[silentTypeIndex] + " messages sent.\n"
        + "The loud mouth: " + loudMouth.displayName + " : " + loudMouth.timeTalked[loudMouthIndex] + " minutes spent talking.\n"
        + "The ghost: " + ghost.displayName + " : " + ghost.timeAFK[ghostIndex] + " minutes spent AFK.\n"
        + "The MIA: " + MIA.displayName + " : " + findFurthestDate(MIA.lastTalked[MIAIndex], MIA.lastMessage[MIAIndex]) + " last seen date.\n"
        + `The summoner: ${summoner.displayName} : ${summoner.summoner[summonerIndex]} summon rituals completed.`
        + "```");

}

async function specificStats(message) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    if (message.mentions.members.size < 1)
        message.channel.send("You have to @someone properly!");
    else if (message.mentions.members.first().id == botID)
        message.channel.send("My stats are private!");
    else
        message.channel.send(message.guild.members.cache.get(message.mentions.members.first().id).user.username + ", ```" + message.member.displayName + "``` requested your stats: ```"
            + (await getStats(message.mentions.members.first())) + "```");
}

async function getStats(member, user) {

    if (!user)
        user = await findUser({ id: member.id });

    let index = user.guilds.indexOf(member.guild.id);

    if (!user.kicked[index]) {
        let stats = "";

        stats = "Total number of messages sent: " + user.messages[index] + "\n"
            + "Last message sent: " + user.lastMessage[index] + "\n"
            + "Total time spent talking (in minutes): " + user.timeTalked[index] + "\n"
            + "Last time you talked was: " + user.lastTalked[index] + "\n"
            + "The games you are signed up for: " + user.games + "\n"
            + "Time spent AFK (in minutes): " + user.timeAFK[index] + "\n"
            + "You joined this server on: " + user.dateJoined[index] + "\n"
            + "Whether you are excluded from pings: " + user.excludePing + "\n"
            + "Whether you are excluded from DMs: " + user.excludeDM + "\n";

        return stats;
    } {
        return -1;
    }
}

async function personalStats(message, params, user) {

    if (message.channel.type != 'dm') {
        let statResult = await getStats(message.member, user);
        if (!user.kicked[user.guilds.indexOf(message.guild.id)]) {
            message.channel.send(mention(message.member.id) + " here are your stats: ```"
                + statResult + "```");
        }
    }
    else {
        message.channel.send("Here are your general stats:");

        let generalStats = "```"
            + "The games you are signed up for: " + user.games + "\n"
            + "Whether you are excluded from pings: " + user.excludePing + "\n"
            + "Whether you are excluded from DMs: " + user.excludeDM + "```";

        message.channel.send(generalStats);

        for (let i = 0; i < user.guilds.length; i++) {

            if (!user.kicked[i]) {
                let stats = "";
                message.channel.send("Here are the stats for the server: " + message.client.guilds.cache.get(user.guilds[i]).name + "")
                stats = "```Total number of messages sent: " + user.messages[i] + "\n"
                    + "Last message sent: " + user.lastMessage[i] + "\n"
                    + "Total time spent talking (in minutes): " + user.timeTalked[i] + "\n"
                    + "Last time you talked was: " + user.lastTalked[i] + "\n"
                    + "Time spent AFK (in minutes): " + user.timeAFK[i] + "\n"
                    + "You joined this server on: " + user.dateJoined[i] + "```";
                message.channel.send(stats);
            }
        }
    }
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

    let finalArray = new Array();

    for (let i = 0; i < searches.length; i++) {

        let query = searches[i];
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

    }//for loop

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

    for (let i = 0; i < studyArray.length; i++) {

        let ppt = studyArray[i];

        for (let j = 0; j < ppt.slides.length; j++) {

            let slide = ppt.slides[j];
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

            for (let k = 0; k < searchWords.length; k++) {

                let searchWord = searchWords[k];
                let result = fuse.search(searchWord);
                for (let l = 0; l < result.length; l++) {
                    let found = result[l];


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
                }//result loop
            }//searchWords loops
        }//slide loop
    }//ppt loop

    let currentSlideDeck = "";

    let searchNumbers = finalObject.length;
    if (query[1] != null)
        if (Number(query[1]) > 0 && Number(query[1]) < searchNumbers)
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

function helpStats(message, params, user) {

    let statsMessage =
        "Command 1: " + prefix + "myStats\n```Shows you all of your stats.```\n"
        + "Command 2: " + prefix + "userStats @User\n```Shows you the stats of the mentioned/pinged user.```\n"
        + "Command 3: " + prefix + "topStats\n```Shows the top stats for the called server.```\n"
        + "Command 4: " + prefix + "allStats\n```Shows the stats for all users on the called server. NOTE: Can only be called by the members with the ADMINSTRATOR permission.```"

    message.channel.send(statsMessage);
}

function helpMusic(message, params, user) {

    let musicMessage =
        "Command 1: " + prefix + "play [youtube url]\n```Plays the song in the url, if one is already playing, it will be added to the queue.```\n"
        + "Command 2: " + prefix + "stop\n```Empties the queue and makes the bot leave the voice channel.```\n"
        + "Command 3: " + prefix + "pause\n```Pauses the current song.```\n"
        + "Command 4: " + prefix + "resume\n```Resumes playing the current song.```\n"
        + "Command 5: " + prefix + "skip\n```Skips the current song.```"
    message.channel.send(musicMessage);
}

function generalHelp(message, params, user) {

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
        + "IMPORTANT: Make sure to run " + prefix + "initiliaseUsers || This only needs to be done once per server, otherwise the other commands will not function properly."
        + " This command adds all users from the called server to the bot's tracker.\n\n"
        + "```";

    message.channel.send(helpMessage);
}

function gameHelp(message, params, user) {

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

async function guildStats(message, params, user) {

    if (message.channel.type == 'dm') return -1;

    if (!message.channel.permissionsFor(message.member).has("ADMINISTRATOR"))
        return message.channel.send("You do not have the administrator permission to view all member stats!")

    let memberArray = message.guild.members.cache.array();

    for (let i = 0; i < memberArray.length; i++) {

        let specificStats = await getStats(memberArray[i])
        if (specificStats != -1) {
            await message.channel.send("Here are the stats for " + memberArray[i].displayName + ": ```"
                + specificStats + "```");
        }
    }

    message.channel.send("```DONE!```");
}

//TRIPLE CHECK THISSSS
async function countTalk() {

    for (let GUILD of Client.guilds.cache) {

        let guild = Client.guilds.cache.get(GUILD[0]);
        let channels = guild.channels.cache;

        for (let CHANNEL of channels) {

            let channel = CHANNEL[1];

            if (channel.type == "voice") {

                for (let MEMBER of channel.members) {

                    let member = MEMBER[1];
                    let user = await findUser({ id: member.id });
                    if (!user) {
                        console.log("found the null user: " + member.displayName + " || From: " + guild.name);
                        await checkExistance(member);
                        user = await findUser({ id: member.id });
                        console.log("AFTER CREATE: " + user);
                    }

                    let index = user.guilds.indexOf(guild.id);

                    if (channel.id == guild.afkChannelID) {

                        let timeAFK = user.timeAFK;
                        timeAFK[index] += 1;

                        User.findOneAndUpdate({ id: member.id },
                            {
                                $set: { timeAFK: timeAFK }
                            }, function (err, doc, res) {
                                //console.log(doc);
                            });
                    } else {

                        let timeTalked = user.timeTalked;
                        timeTalked[index] += 1;

                        let lastTalked = user.lastTalked;
                        lastTalked[index] = getDate();

                        User.findOneAndUpdate({ id: member.id },
                            {
                                $set: { timeTalked: timeTalked, lastTalked: lastTalked }
                            }, function (err, doc, res) {
                                //console.log(doc);
                            });
                    }
                }
            }
        }
    }
}

function updateMessage(message, user) {

    if (!user) return;
    let index = user.guilds.indexOf(message.guild.id);
    user.messages[index] = user.messages[index] + 1;
    user.lastMessage[index] = getDate();

    console.log(`${user.displayName} is now at ${user.messages[index]} messages`);

    User.findOneAndUpdate({ id: user.id },
        {
            $set: {

                messages: user.messages,
                lastMessage: user.lastMessage,
            }
        }, function (err, doc, res) {
            if (err) console.trace(err)
            if (res) console.trace(res)
        });
}

function excludePing(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludePing: true } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be excluded from any further pings.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludePing: true } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " can now be pinged once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
        return -1;
    }
}

function excludeDM(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {
        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: true } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be excluded from any further DMs.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { DM: false } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be DM'ed once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }
}

function setNotifyUpdate(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[27] + "** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyUpdate: true } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be notified of new feature releases.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyUpdate: false } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be excluded from any new feature releases.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[27] + "** *true/false*");
        return -1;
    }
}

function setNotifyTutorials(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[28] + "** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyTutorial: true } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be notified of new/incomplete tutorials.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyTutorial: false } }, function (err, doc, res) { });
        message.channel.send(mention(message.author.id) + " will be excluded from any new/incomplete tutorials.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[28] + "** *true/false*");
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

    if (user.games.length < 1) {

        message.channel.send(`You have no games in your games list, please sign up for some with ${prefix}` + Commands.commands[2]);
        return;
    }
    else {

        if (Array.isArray(game)) {
            let setty = new Set(game);
            game = Array.from(setty);
        }
        else {

            game = [game];
        }

        let gameArr = user.games;
        let invalidGames = new Array();
        let removedGames = new Array();

        games.sort();

        if (game.length == 1) {

            let check = checkGame(user.games, game, user);

            if (check == -1) {

                message.channel.send(game + " is not assigned to any games, please try again.");
                return -1;
            }
            else if (check.result[0].score != 0) {

                message.channel.send(`${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:` + "```" + check.prettyList + "```");
                specificCommandCreator(removeGame, [message, -1, user], check.result, user);
                return -11;
            }
            else {

                game[0] = check.result[0].item;
            }
        }

        //game.forEach(async gameTitle => {make it for...of loop!

        let gameTitle = game[0];

        if (isNaN(gameTitle)) {

            if (gameArr.includes(gameTitle)) {
                removedGames.push(gameTitle);
                gameArr.splice(gameArr.indexOf(gameTitle), 1);
            }
            else
                invalidGames.push(gameTitle);
        }
        else {
            gameTitle = Math.floor(gameTitle);
            if (gameTitle < gameArr.length && gameTitle >= 0) {
                removedGames.push(gameArr[gameTitle]);
                gameArr.splice(gameTitle, 1)
            }
            else
                invalidGames.push(gameTitle);
        }
        //});

        gameArr.sort();


        if (invalidGames.length > 0) {
            invalidGames.sort();
            let congrats = "";
            for (let i = 0; i < invalidGames.length; i++) {
                //if (invalidGames[i].length > 1)
                congrats += i + ") " + invalidGames[i] + "\n";
            }
            message.channel.send("The following are invalid Games/Numbers: ```" + congrats + "```");
        }

        if (removedGames.length > 0) {
            removedGames.sort();
            let congrats = "";
            for (let i = 0; i < removedGames.length; i++) {
                //if (tempArr[i].length > 1)
                congrats += i + ") " + removedGames[i] + "\n";
            }
            message.channel.send("The following games were successfuly removed from your game list: ```" + congrats + "```");
        }


        gameArr.sort();
        User.findOneAndUpdate({ id: user.id },
            {
                $set: { games: gameArr }
            }, function (err, doc, res) {
                //console.log(doc);
            });

        if (removedGames.length > 0)
            return removedGames.length;
        else
            return 0;
    }
}

function mention(id) {
    return "<@" + id + ">"
}

function directMessage(message, memberID, game) {

    message.guild.members.cache.get(memberID).user.send(message.member.displayName + " has summoned you for " + game + " in "
        + message.guild.name + "!");
}

async function gameStats(message, params, user) {

    if (message.channel.type != 'dm') {
        let game = Array.isArray(params) ? params[0].trim() : params;
        let check = checkGame(games, params, user);

        if (check == -1) {

            message.channel.send(game + " is not assigned to any games, please try again.");
            return -1;
        }
        else if (check.result[0].score != 0) {

            message.channel.send(`${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:` + "```" + check.prettyList + "```");
            specificCommandCreator(gameStats, [message, -1, user], check.result, user);
            return -11;
        }
        else {

            let users = await getUsers();
            let signedUp = new Array();

            for (let i = 0; i < users.length; i++) {

                if (users[i].games.includes(game) && users[i].guilds.includes(message.guild.id))
                    if (!users[i].kicked[users[i].guilds.indexOf(message.guild.id)]) {
                        signedUp.push(users[i]);
                    }
            }

            if (signedUp.length > 0)
                message.channel.send(`There are ${signedUp.length} users signed up for ${game}. Would you like to see a list of the members who signed up? Y/N (In Dev.)`);
            else
                message.channel.send(`There are ${signedUp.length} users signed up for ${game}.`);
            return signedUp.length;
        }
    }
    else {
        message.channel.send(`*${Commands.commands[31]}* is only valid from inside a server text channel!`);
        return -1;
    }
}

async function topGames(message, params) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    if (message.channel.type != 'dm') {
        let users = await getUsers();
        let gameMap = new Map();

        for (let i = 0; i < users.length; i++) {

            if (users[i].guilds.includes(message.guild.id)) {

                if (!users[i].kicked[users[i].guilds.indexOf(message.guild.id)]) {
                    let tempGames = users[i].games;

                    for (let j = 0; j < tempGames.length; j++) {

                        if (tempGames[j].length > 2) {

                            if (!gameMap.get(tempGames[j])) {

                                gameMap.set(tempGames[j], 1);
                            }
                            else {
                                gameMap.set(tempGames[j], (gameMap.get(tempGames[j]) + 1));
                            }
                        }
                    }
                }
            }
        }

        gameMap = [...gameMap.entries()].sort(function (a, b) { return b[1] - a[1] });

        let maxResults = 5;
        if (!(isNaN(params[0])))
            maxResults = params[0];

        if (gameMap.length == 0) {
            message.channel.send(`No one has signed up for any games in ${message.guild.name}, be the first!`);
            return;
        }

        else if (maxResults > gameMap.length && maxResults) {

            maxResults = gameMap.length;
            message.channel.send(`There are only ${maxResults} games people signed up for on ${message.guild.name}`);
        }
        else {
            message.channel.send(`You did not specify the number of games to display, as such, I will display the top ${maxResults}`
                + ` games people signed up for on the ${message.guild.name} server:`);
        }

        let finalList = ``;

        for (let i = 0; i < maxResults; i++) {

            finalList += `${i + 1}) ${gameMap[i][0]} has ${gameMap[i][1]} user(s) signed up for it.\n`;
            //message.channel.send(`${gameMap}There are ${gameMap.length} users signed up for ${game}. Would you like to see a list of the members who signed up? Y/N (In Dev.)`);
        }

        message.channel.send("```" + finalList + "```");

        return gameMap.length;
    }
    else {

        message.channel.send(`*${Commands.commands[32]}* is only valid from inside a server text channel!`);
        return -1;
    }
}

async function pingUsers(message, game, user) {//Return 0 if it was inside a DM

    if (message.channel.type == 'dm') {
        message.channel.send(message.author.username + " has summoned " + mention(botID) + " for some " + game
            + "\nUnfortunately I cannot play games, why not try the same command inside a server?");
        return 0;
    }
    else if (message.content == game) {
        message.channel.send("You have to provide an actual game to ping!");
        return -1;
    }

    let check = checkGame(games, game, user);

    if (check == -1) {

        message.channel.send(game + " is not assigned to any games, please try again.");
    }
    else if (check.result[0].score != 0) {

        message.channel.send(`${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:` + "```" + check.prettyList + "```");
        specificCommandCreator(pingUsers, [message, -1, user], check.result, user);
        return -11;
    }
    else {

        game = check.result[0].item;

        let users = await getUsers();
        let signedUp = "";
        let defaulted = "";

        for (let user of users) {
            if (user.id != message.author.id) {

                if (user.guilds.includes(message.guild.id)) {

                    if (!user.kicked[user.guilds.indexOf(message.guild.id)]) {
                        if (isNaN(game)) {

                            if (user.games.includes(game)) {

                                if (user.excludePing == false)
                                    signedUp += mention(user.id);
                                if (user.excludeDM == false)
                                    directMessage(message, user.id, game);
                            }
                        }
                        else if (user.games.includes(games[game])) {
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
            }
        }//Each user for loop

        if (signedUp.length > 3)
            message.channel.send(message.member.displayName + " has summoned " + signedUp + " for some " + game);
        else
            message.channel.send("No one has signed up for " + game + ".");
        let index = user.guilds.indexOf(message.guild.id);
        user.summoner[index] += 1;
        User.findOneAndUpdate({ id: user.id }, { $set: { summoner: user.summoner } }, function (err, doc, res) { });
        return 1;
        // if (defaulted.length > 1) {

        //     message.channel.send(defaulted + "``` you have yet to exlcude yourself from summons or signUp for a game so have been pinged by default"
        //         + " if you wish to never be summoned for games, type sa!exclude, or signUp for at least one game. Type " + prefix + " for more information```");
        // }NOTE ENABLE LATER
    }
}

async function createUser(member) {

    let newUser = {
        displayName: member.displayName,
        id: member.id,
        messages: [0],
        lastMessage: ["0-0-0"],
        timeTalked: [0],
        lastTalked: ["0-0-0"],
        games: [],
        timeAFK: [0],
        dateJoined: [getDate()],
        excludePing: false,
        excludeDM: false,
        guilds: [member.guild.id],
        activeTutorial: -1,
        tutorialStep: -1,
        previousTutorialStep: -1,
        notifyUpdate: false,
        notifyTutorial: true,
        completedTutorials: [],
        summoner: [0],
        kicked: [false],
        prefix: ["-1"],
        defaultPrefix: "-1"
    }

    let userModel = new User(newUser);
    await userModel.save();
    return userModel;
}

async function addGuild(member, memberDB) {

    memberDB.guilds.push(member.guild.id);
    memberDB.messages.push(0);
    memberDB.lastMessage.push("0-0-0");
    memberDB.timeTalked.push(0);
    memberDB.lastTalked.push("0-0-0");
    memberDB.timeAFK.push(0);
    memberDB.dateJoined.push(getDate());
    memberDB.summoner.push(0);
    memberDB.kicked.push(false);
    memberDB.prefix.push("-1");

    memberDB.set("guilds", memberDB.guilds)
    memberDB.set("messages", memberDB.messages)
    memberDB.set("lastMessage", memberDB.lastMessage)
    memberDB.set("timeTalked", memberDB.timeTalked)
    memberDB.set("lastTalked", memberDB.lastTalked)
    memberDB.set("timeAFK", memberDB.timeAFK)
    memberDB.set("dateJoined", memberDB.dateJoined)
    memberDB.set("summoner", memberDB.summoner)
    memberDB.set("kicked", memberDB.kicked)
    memberDB.set("prefix", memberDB.prefix)
    memberDB.save();
}

async function createGuild(guild) {

    let newGuild = {
        id: guild.id,
        prefix: "-1",
        name: guild.name
    }

    let guildModel = new Guild(newGuild);
    await guildModel.save();
    return guildModel;
}

/**
 * true = Existed in DB
 * false = didn't exist in DB
 */
async function checkExistance(member) {

    let tempUser = await findUser({ id: member.id })
    if (tempUser) {

        if (tempUser.guilds.includes(member.guild.id)) {

            let index = tempUser.guilds.indexOf(member.guild.id);
            tempUser.kicked[index] = false;
            User.findOneAndUpdate({ id: tempUser.id }, { $set: { kicked: tempUser.kicked } }, function (err, doc, res) { });
            return true;
        }
        else {//The user exists, but not with a matching guild in the DB

            await addGuild(member, tempUser)
            return true;
        }
    }
    else {
        console.log("The user doesnt exist.");
        await createUser(member);
        return false;
    }
}

async function initialiseUsers(message) {
    if (message.channel.type == 'dm') return -1;
    let newUsers = 0;
    let existingUsers = 0;

    for (let MEMBER of message.channel.guild.members.cache) {

        let member = MEMBER[1];

        if (await (checkExistance(member))) {//User exists with a matching guild in the DB
            existingUsers++;
        }
        else {

            (await createUser(member));
            newUsers++;
        }
    }
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

async function pause(message) {
    if (message.channel.type != 'dm') return
    if (queue.get(message.guild.id)) { queue.get(message.guild.id).dispatcher.pause(); }
}

async function skip(message) {

    if (message.channel.type != 'dm') return;
    if (queue.get(message.guild.id)) {
        queue.get(message.guild.id).songs.shift();
        playSong(message.guild, queue.get(message.guild.id).songs[0]);
    }
}

async function stop(message) {
    if (message.channel.type != 'dm') return
    if (queue.get(message.guild.id)) {
        queue.get(message.guild.id).voiceChannel.leave();
        queue.delete(message.guild.id);
    }
}

async function resume(message) {
    if (message.channel.type != 'dm') return
    if (queue.get(message.guild.id)) { queue.get(message.guild.id).dispatcher.resume(); }
}

async function play(message) {

    const serverQueue = queue.get(message.guild.id);
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const songInfo = await ytdl.getInfo(args[1],
        async function (err, info) {
            if (err) message.channel.send("Invalid YouTube URL");
            else {
                const song = {
                    title: info.title,
                    url: info.video_url,
                };
                console.log(serverQueue)
                if (!serverQueue) {
                    console.log(`server que is empty`)
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
        }
    );
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
    // let nameArray = new Array();

    // for (let user of users) {

    //     // if (!nameArray.includes(user.displayName))
    //     //     nameArray.push(user.displayName)
    //     // else
    //     //     console.log("DUPIcLATE: " + user.displayName)


    //     // let messageArray = element.messages.split("|").filter(element => element.length > 0);
    //     // let lastMessageArray = element.lastMessage.split("|").filter(element => element.length > 0);
    //     // let timeTalkedeArray = element.timeTalked.split("|").filter(element => element.length > 0);
    //     // let lastTalkedArray = element.lastTalked.split("|").filter(element => element.length > 0);
    //     // let gamesArray = element.games.split("|").filter(element => element.length > 0);
    //     // let timeAFKArray = element.timeAFK.split("|").filter(element => element.length > 0);
    //     // let dateJoinedArray = element.dateJoined.split("|").filter(element => element.length > 0);
    //     // let guildsArray = element.guilds.split("|").filter(element => element.length > 0);

    //     // await User.findOneAndUpdate({ id: element.id },
    //     //     {
    //     //         $set: { games: gamesArray,
    //     //                 messages: messageArray,
    //     //                 lastMessage: lastMessageArray,
    //     //                 timeTalked: timeTalkedeArray,
    //     //                 lastTalked: lastTalkedArray,
    //     //                 timeAFK: timeAFKArray,
    //     //                 dateJoined: dateJoinedArray,
    //     //                 guilds: guildsArray

    //     //         }
    //     //     });

    //     let tempArr = [];

    //     for(let i = 0; i < user.guilds.length; i++){

    //         tempArr.push("-1");
    //     }


    //     await User.findOneAndUpdate({id: user.id}, {$set: {prefix: tempArr}, defaultPrefix: "-1"}, function(err, doc, res){});

    // }//for user loop

    // // // fs.writeFile(__dirname + "/backups/" + getDate() + ".json", JSON.stringify(users), function (err, result) {
    // // //     if (err) console.log('error', err);
    // // // });


    // console.log("CALLED UPDATE ALL");
}

async function minuteCount() {
    countTalk();
}

async function updateGames(message, game, user) {

    console.log(`game: ${game}`);

    if (Array.isArray(game)) {
        let setty = new Set(game);
        game = Array.from(setty);
    }
    else {
        game = [game];
    }

    games.sort();
    let existingGames = user.games;
    let finalGameArray = new Array();
    let alreadyTracked = new Array();
    let invalidGames = new Array();

    if (game.length == 1) {

        let check = checkGame(games, game, user);

        if (check == -1) {

            message.channel.send(game + " is not assigned to any games, please try again.");
            return -1;
        }
        else if (check.result[0].score != 0) {

            message.channel.send(`${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:` + "```" + check.prettyList + "```");
            specificCommandCreator(updateGames, [message, -1, user], check.result, user);
            return -11;
        }
        else {

            game[0] = check.result[0].item;
        }
    }

    for (let i = 0; i < game.length; i++) {
        gameTitle = game[i];

        gameTitle = gameTitle.trim();

        if (isNaN(gameTitle)) {

            gameTitle = gameTitle.trim();

            if (games.includes(gameTitle)) {
                if (!existingGames.includes(gameTitle)) {
                    finalGameArray.push(gameTitle);
                }
                else
                    alreadyTracked.push(gameTitle);
            }
            else
                invalidGames.push(gameTitle);
        }
        else {
            gameTitle = Math.floor(gameTitle);
            if (gameTitle < games.length && gameTitle >= 0) {

                if (!existingGames.includes(games[gameTitle])) {
                    finalGameArray.push(games[gameTitle]);
                }
                else
                    alreadyTracked.push(games[gameTitle]);
            }
            else
                invalidGames.push(games[gameTitle]);
        }
    }

    if (finalGameArray.length > 0) {

        finalGameArray.sort();
        let congrats = "";
        for (let i = 0; i < finalGameArray.length; i++) {
            //if (tempArr[i].length > 1)
            congrats += i + ") " + finalGameArray[i] + "\n";
        }
        message.channel.send("Succesfuly signed up for: ```" + congrats + "```");
    }

    if (alreadyTracked.length > 0) {
        alreadyTracked.sort();
        let congrats = "";
        for (let i = 0; i < alreadyTracked.length; i++) {
            //if (tempArr[i].length > 1)
            congrats += i + ") " + alreadyTracked[i] + "\n";
        }
        message.channel.send("The following games are already tracked for you: ```" + congrats + "```");
    }

    if (invalidGames.length > 0) {
        invalidGames.sort();
        let congrats = "";
        for (let i = 0; i < invalidGames.length; i++) {
            //if (teminvalidGamespArr[i].length > 1)
            congrats += i + ") " + invalidGames[i] + "\n";
        }
        message.channel.send("The following are invalid games: ```" + congrats + "```");
    }

    let length = finalGameArray.length;
    if (user.games)
        finalGameArray = finalGameArray.concat(user.games).filter(v => (v));//removing nulls or undefined

    finalGameArray.sort();
    User.findOneAndUpdate({ id: user.id },
        {
            $set: { games: finalGameArray }
        }, function (err, doc, res) {
            //console.log(doc);
        });

    if (length > 0)
        return length;
    else
        return 0;
}

function checkGame(gameArray, params, user) {

    if (!isNaN(params)) {
        if (params < 0 || params >= gameArray.length) {
            return -1;
        }
        params = gameArray[Math.floor(params)];
    }
    else if (Array.isArray(params)) {
        params = params[0].trim();
    }
    else {
        params = params.trim();
    }

    let finalArray = new Array();
    let finalList = "";
    let newOptions = {
        ...options,
        minMatchCharLength: params.length / 2,
        findAllMatches: false,
        includeScore: true,
    }
    //
    let fuse = new Fuse(gameArray, newOptions);
    let result = fuse.search(params);
    let maxResults = 5;
    if (maxResults > result.length)
        maxResults = result.length;

    for (let i = 0; i < maxResults; i++) {

        finalList += i + ") " + result[i].item + "\n";
        finalArray.push(result[i]);
    }

    let completeCheck = {
        result: finalArray,
        prettyList: finalList
    };

    if (finalArray.length > 0)
        return completeCheck;
    else return -1
}

setInterval(minuteCount, 60 * 1000);

//set up automated help/explanation text


//DM quality of life (for now its just prefixes?) - prefix tutorial
//for game stats, add a Y/N for seeing a list of all the people signed up for it


//for the game tutorial add a continuation showing the remaining extra commands, they can either cover them or skip them - make it Y/N
//if they dont, they can always start it by saying prefixADVANCEDGAMETUTORIAL - which is a seperate tutorial all together. If they want to do it to type that command


//Be alerted if a user is found in a voice channel? Stalker lmao
//play https://www.youtube.com/watch?v=cKzFsVfRn-A when sean joins, then kick everyone.

//Stats Tutorial

//coin flipper
//game decider
//roll command - for however many sided die
//ping-pong command
//add a timer

//Then make a tutorial for the above commands...


//look into start typing in message documentation to make it feel more alive?

//make remove game array - it is but broken - ez fix, mark all the spots with -1, then splice out all of them



//Make the youtube player complete (at least youtube)
//youtube live streams are broken 


//Twitch notification/signup when a streamer goes live
//https://dev.twitch.tv/docs/api/reference/#get-streams
//add streamer stats



//Make a vote system for the next feature to focus on
//MEE6 bot - beatiful ui, build in message formatin? embeds or something,
//if authorised, you can control stuff from the website.

//seal idan easter eggs
process.on('unhandledRejection', (reason, p) => { console.log(reason) });