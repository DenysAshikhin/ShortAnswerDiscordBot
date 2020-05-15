const Discord = require('discord.js');
const User = require('./User.js');
const Bot = require('./Bot.js');
const Guild = require('./Guild.js')
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const path = require('path');
let ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const ytsr = require('ytsr');

var mv = require('mv');


const readline = require('readline');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const numCPUs = require('os').cpus().length;
console.log(`I have ${numCPUs} cores!`);//https://nodejs.org/api/cluster.html#cluster_cluster - can be useful to shard? Might help me get to like 
//10k servers on heroku

const gameJSON = require('./gameslist.json');
const Commands = require('./commands.json');
const studyJSON = require('./medstudy.json');
const DATABASE = require('./backups/26-04-2020.json');

const fs = require('fs');
const fsPromises = fs.promises;

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
    ],
    steps: []
};
const options = {
    isCaseSensitive: false,
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

var Embed = {
    "title": "Short Answer Bot",
    //"description": "this supports [named links](https://discordapp.com) on top of the previously shown subset of markdown. ```\nyes, even code blocks```",
    "description": "",
    "url": "",
    "color": 14837504,
    "timestamp": new Date(),
    "footer": {
        "text": "Created by The Last Spark",
        "image": ""
    },
    "thumbnail": {
        //"url": "https://cdn.discordapp.com/attachments/468997633487273994/705218426280607784/Clan_-_Orange_New_-_New.png"
    },
    "image": {
        "url": ""
    },
    // "author": {
    //     "name": " ",
    //     "url": "",
    //     "icon_url": "https://cdn.discordapp.com/attachments/468997633487273994/705218426280607784/Clan_-_Orange_New_-_New.png"
    //   },
    "fields": [
        // {
        //     "name": "🤔",
        //     "value": "some of these properties have certain limits..."
        // },
        // {
        //     "name": "😱",
        //     "value": "try exceeding some of them!"
        // },
        // {
        //     "name": "🙄",
        //     "value": "an informative error should show up, and this view will remain as-is until all issues are fixed"
        // },
        // {
        //     "name": "<:thonkang:219069250692841473>",
        //     "value": "these last two",
        //     "inline": true
        // },
        // {
        //     "name": "<:thonkang:219069250692841473>",
        //     "value": "are inline fields",
        //     "inline": true
        // }
    ]
};

const tags = [
    1,// - games
    2,// - stats
    3,// - miscellaneous
    4,// - music
    5,// - administrator
    6,// - quality of life
    7,// - help
    8,// - general
    9,// - tutorials
    10,// - bugs/suggestions/improvements
]


//FAT NOTE: (true >= false) is TRUE
var Client = new Discord.Client();
var commandMap = new Map();
var commandTracker = new Map();
var config = null;
var queue = new Map();
var download = new Map();
var activeSkips = new Map();
var lastSkip = new Map();
var squads = new Map();
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

function newStuff() {

    for (section of tags) {

        for (let i = 0; i < Commands.commands.length; i++) {

            if (Commands.subsection[i].includes(section)) {

                switch (section) {

                    case 1:
                        console.log(`Game Command: ${Commands.commands[i]}`)
                        break;
                    case 2:
                        console.log(`Stats Command: ${Commands.commands[i]}`)
                        break;
                    case 3:
                        console.log(`Miscellaneous Command: ${Commands.commands[i]}`)
                        break;
                    case 4:
                        console.log(`Music Command: ${Commands.commands[i]}`)
                        break;
                    case 5:
                        console.log(`Administrator Command: ${Commands.commands[i]}`)
                        break;
                    case 6:
                        console.log(`Quality of Life Command: ${Commands.commands[i]}`)
                        break;
                    case 7:
                        console.log(`Help Command: ${Commands.commands[i]}`)
                        break;
                    case 8:
                        console.log(`General Command: ${Commands.commands[i]}`)
                        break;
                    case 9:
                        console.log(`Tutorial Command: ${Commands.commands[i]}`)
                        break;
                    case 10:
                        console.log(`Bugs Command: ${Commands.commands[i]}`)
                        break;
                }
                console.log(`${Commands.subsection[i]}`)

            }
        }
    }
}

connectDB.once('open', async function () {

    await Client.login(token);

    updateAll()
    populateCommandMap();
    removeTempSongs();

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

        if (message.content.substr(0, prefix.length) == prefix) {

            let permission = message.channel.permissionsFor(message.guild.members.cache.get(botID));
            if (!permission.has("SEND_MESSAGES"))
                return message.author.send("I don't have the right permissions to send messages and embed links in that channel!");
            if (!permission.has("EMBED_LINKS"))
                await message.channel.send("I don't have the right permissions to embed links in this channel, **some commands may not work!**");

            let command = message.content.split(' ')[0].substr(prefix.length).toUpperCase();
            let params = message.content.substr(message.content.indexOf(' ') + 1).split(',');

            if (!params[0])
                params[0] = "";

            commandMatcher(message, command, params, user);
            return;
        }
        else if (message.content.trim() == (defaultPrefix + "help")) {
            message.channel.send("You entered an invalid prefix - the proper one is: " + prefix);
        }
        else {//Command tracker stuff
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
    commandMap.set(Commands.commands[36], forward)
    commandMap.set(Commands.commands[37], rewind)
    commandMap.set(Commands.commands[38], seek)
    commandMap.set(Commands.commands[39], reverse)
    commandMap.set(Commands.commands[40], addSong)
    commandMap.set(Commands.commands[41], createPlaylist)
    commandMap.set(Commands.commands[42], myPlayLists)
    commandMap.set(Commands.commands[43], removeSong)
    commandMap.set(Commands.commands[44], playlist)
    commandMap.set(Commands.commands[45], savePlayList)
    commandMap.set(Commands.commands[46], removePlayList)
    commandMap.set(Commands.commands[47], Queue)
    commandMap.set(Commands.commands[48], deQueue)
    commandMap.set(Commands.commands[49], viewActiveSummons)
    commandMap.set(Commands.commands[50], banish)
}

function setServerPrefix(message, params, user) {

    if (params == message.content) {
        message.channel.send("You have to provide an actual prefix!");
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

    if (message.channel.type == 'dm') return message.channel.send("You can only set the default server prefix from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("You do not have the required permissions to set the default prefix for the server")


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
        if (result == 1)
            commandTracker.delete(message.author.id);

        return result;
    }
}

async function commandMatcher(message, command, params, user) {

    let check = await checkCommands(command);

    if (check == -1) {
        message.channel.send(`I didn't recognize that command, please try again?`);
        return -1;
    }
    else if (check.result[0].score != 0) {

        let fieldArray = new Array();

        for (let i = 0; i < check.result.length; i++) {

            //fieldArray.push({ name: check.result[i].item, value: i, inline: false })
            fieldArray.push({ name: `${i} - ` + check.result[i].item, value: "** **", inline: false })
        }
        let newEmbed = JSON.parse(JSON.stringify(Embed));
        newEmbed.date = new Date();
        newEmbed.description = `${command} is not a valid command, if you meant one of the following, simply type the **number** you wish to use:`;
        newEmbed.fields = fieldArray;

        message.channel.send({ embed: newEmbed })
        specificCommandCreator(commandMatcher, [message, -1, params, user], check.result, user);
        return -11;
    }
    else {
        specificCommandCreator(commandMap.get(check.result[0].item), [message, params, user], null, user);
        return await triggerCommandHandler(message, user, true);
    }
}

//-1 invalid input, 0 don't delete (passed to command matcher) - need it next time, 1 handled - delete
async function handleCommandTracker(specificCommand, message, user, skipSearch) {

    //console.log(specificCommand)
    let params = message.content;
    let tutorialResult;
    if (!skipSearch) {
        if (!isNaN(params) && params.length > 0) {
            params = Math.floor(params);
            if (params >= specificCommand.choices.length || params < 0) {
                message.channel.send("You have entered an invalid number, please try again. Or type *-1* to quit the suggestion.");
                return -1;
            }

            specificCommand.defaults[1] = specificCommand.choices[Math.floor(params)].item
            tutorialResult = await tutorialHandler(specificCommand.defaults[0], specificCommand.command, specificCommand.defaults[1], user);
            if (tutorialResult != -22)
                return tutorialResult;
        }
        else {
            message.channel.send("You entered an invalid option, please try again or enter *-1* to quit the suggestion prompt.");
            return 0;
        }
    }
    else {

        tutorialResult = await tutorialHandler(specificCommand.defaults[0], specificCommand.command, specificCommand.defaults[1], user);
        if (tutorialResult != -22)
            return tutorialResult;
    }

    let finishy = await specificCommand.command.apply(null, specificCommand.defaults);
    //console.log(`finishy: ${finishy == 0 || finishy == -11}`)
    if (finishy == -11 || finishy == 0)
        return 0;
    else {
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
    let newOptions = JSON.parse(JSON.stringify(options));
    newOptions = {
        ...newOptions,
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


    let permission = message.channel.permissionsFor(message.guild.members.cache.get(botID));
    if (!permission.has("MANAGE_MESSAGES"))
        return message.channel.send("I do not have the required permissions to delete messages!")


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
    message.channel.send("Your suggestion has been forwarded!");
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
//-22 meaning no matching tutorial was found
async function tutorialHandler(message, command, params, user) {

    switch (user.activeTutorial) {
        case 0:
            if (command == GameTutorial.specificCommand[user.tutorialStep] || command == gameTutorial) {

                return await gameTutorial(message, params, command);
            }
        case 1:

            break;
    }

    return -22;
}

// `Greetings!\nYou are getting this message because I noticed you haven't signed up for any games! If you would like to summon other players (friends)`
// + ` to play a game with you, be notified when someone else wants to play a game, manage your games list and more type **${prefix}gameTutorial**`
// + ` for a step-by-step walkthrough! However, if you would like to opt out of this and all future tutorials, type **${prefix}tutorials** *false*.`

function createTutorialEmbed(tutorialStep) {

    let prompt = GameTutorial.steps[tutorialStep];
    let index = Commands.commands.indexOf(GameTutorial.expectedCommand[tutorialStep]);
    let fieldArray = new Array();

    if (index != -1) {
        for (let i = 0; i < Commands.example[index].length; i++) {

            fieldArray.push({
                name: `Example ${i + 1})`,
                value: prefix + Commands.example[index][i].substring(3)
            })
        }
    } else {

    }

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.date = new Date();
    newEmbed.title += " Game Tutorial";
    newEmbed.description = prompt;
    newEmbed.fields = fieldArray;

    return newEmbed;
}

async function gameTutorial(message, params, command) {

    let user = await findUser({ id: message.author.id });

    GameTutorial.steps = [
        `Awesome, welcome to the game tutorial! let's start by searching for a game you play with others!\nDo so by typing **${prefix}search**  *nameOfGame*.`,

        `Now that you see a bunch of results, hopefully the game you wanted is towards the top, along with the associated number.`
        + ` Please add any valid (and new) game to your games list to continue`,

        `You can also sign up for as many games at once as you would like by seperating each entry by a comma - you can mix both words and numbers.`
        + ` Try signing up for **at least two new games** at once.`,

        `Now that we have some games tracked for you, let's view your complete game list by typing **${prefix}` + Commands.commands[3] + `**`,

        `Now try removing any of the games in your games list by typing **${prefix}` + Commands.commands[4] + `** *game#*.`
        + ` Just a heads up that the GAME# is the number from your games list.`,

        `Now if you want to play a game, but not sure who is up for it, you can simple type **${prefix}` + Commands.commands[13]
        + `** *nameOfGame*/*#ofGame* and anyone who has this game will be notified.`,

        `Almost done, now some quality of life, when someone pings a game there will be two notifications for you, the first is`
        + ` an @mention in the text channel it was sent from. To disable/enable @mentions simply type`
        + ` **${prefix}` + Commands.commands[5] + `** *true/false*. *False* = you will be pinged, *True* = you will not be pinged.`,

        `The second notification is a direct message. To disable/enable direct messages from pings simply type`
        + ` **${prefix}` + Commands.commands[6] + `** *true/false*. *False* = you will be DMed, *True* = you will not be DMed.`,

        `Congratulations! You have completed the game tutorial. As a reward, you can now offer feedback, suggestions or anything else to the creator by typing`
        + ` **${prefix}` + Commands.commands[26] + `** *any suggestion here* and I'll forward the message to the creator. For a more general help,`
        + ` type **${prefix}` + Commands.commands[7] + `**`
        + `\nAs a final note, this bot is being rapidly developed with new features constantly being added,`
        + ` if you would like to recieve a private message when a new feature is live, type **${prefix}` + Commands.commands[27] + `** *true/false*.`
    ]

    if (user.tutorialStep == -1) {

        //newEmbed.description = GameTutorial.steps[0];
        message.channel.send({ embed: createTutorialEmbed(0) })

        await User.findOneAndUpdate({ id: user.id },
            {
                $set: {
                    activeTutorial: 0,
                    tutorialStep: 0,
                    previousTutorialStep: 0
                }
            }, function (err, doc, res) { });
        return 1;
    }//
    else {
        if (user.activeTutorial == 0 || user.activeTutorial == -1) {

            if (command == commandMap.get(Commands.commands[25])) {

                message.channel.send({ embed: createTutorialEmbed(user.tutorialStep) })
                return 1;
            }
            else if (user.tutorialStep - user.previousTutorialStep == 1) {//If the user completed a previous step succesfuly, give the new prompt

                if (user.tutorialStep != GameTutorial.steps.length - 1) {

                    message.channel.send({ embed: createTutorialEmbed(user.tutorialStep) })

                    await User.findOneAndUpdate({ id: user.id },
                        {
                            $set: {
                                previousTutorialStep: user.previousTutorialStep + 1,
                            }
                        }, function (err, doc, res) { });
                    return 1;
                }
                else {//Tutorial over!!!!!
                    //Need to add the recommend and something else commands
                    message.channel.send({ embed: createTutorialEmbed(user.tutorialStep) })
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
                    return 1;
                }
            }
            else {//Test if their response is the correct one.

                if (command == GameTutorial.specificCommand[user.tutorialStep]) {
                    let result = await GameTutorial.specificCommand[user.tutorialStep].call(null, message, params, user);
                    if (result >= GameTutorial.expectedOutput[user.tutorialStep]) {
                        User.findOneAndUpdate({ id: user.id }, { $set: { tutorialStep: user.tutorialStep + 1 } }, function (err, doc, res) { });
                        setTimeout(gameTutorial, 1000, message, params, command);
                    }
                    return result;
                }
                else
                    return false;
            }
        }
        else {
            message.channel.send(`You are already doing ${tutorial[user.activeTutorial]}, to quit it type **${prefix}quitTutorial**`);
            return 1;
        }
    }
}

async function personalGames(message, params, user) {

    if (!user.games)
        user = await findUser({ id: message.author.id })
    let games = user.games;
    let fieldArray = new Array();
    let display = message.author.username;
    if (message.member != null)
        display = message.member.displayName;
    let left = false;


    for (let i = 0; i < games.length; i++) {
        left = true;

        fieldArray.push({ name: `${i}) ` + games[i], value: "** **", inline: false })

        if (i % 24 == 0 && i > 0) {

            let gameEmbed = JSON.parse(JSON.stringify(Embed));
            gameEmbed.date = new Date();
            gameEmbed.description = display + " here are the games you are signed up for:";
            gameEmbed.fields = fieldArray;

            await message.channel.send({ embed: gameEmbed });
            fieldArray = new Array();
            left = false;
        }
    }

    if (games.length > 0) {
        if (left) {

            let gameEmbed = JSON.parse(JSON.stringify(Embed));
            gameEmbed.date = new Date();
            gameEmbed.description = display + " here are the games you are signed up for:";
            gameEmbed.fields = fieldArray;

            message.channel.send({ embed: gameEmbed });
        }

        return 1;
    }
    else
        message.channel.send("You are not signed up for any games.");

    return 0;

}

async function gameSuggestion(member) {//


}

function findFurthestDate(date1, date2) {

    let numberDate1 = Number(date1.substring(6)) * 365 + Number(date1.substring(3, 5)) * 30 + Number(date1.substring(0, 2));
    let numberDate2 = Number(date2.substring(6)) * 365 + Number(date2.substring(3, 5)) * 30 + Number(date2.substring(0, 2));

    if (numberDate1 < numberDate2)
        return date1;
    return date2;
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

                if (userDate == findFurthestDate(userDate, MIADate) && userDate != "0-0-0") {
                    MIA = user;
                    MIAIndex = userIndex;
                }
                else if (MIADate == "0-0-0" && userDate != "0-0-0") {
                    MIA = user;
                    MIAIndex = userIndex;
                }
            }
        }
    }


    let statsEmbed = JSON.parse(JSON.stringify(Embed));
    statsEmbed.date = new Date();
    statsEmbed.title = Embed.title + ` - Top Stats for ${message.guild.name}!`;
    statsEmbed.thumbnail.url = message.guild.iconURL();
    statsEmbed.fields = [
        { name: `The Silent Type: ${silentType.displayName}`, value: `${silentType.messages[silentTypeIndex]} messages sent.` },
        { name: `The Loud Mouth: ${loudMouth.displayName}`, value: `${loudMouth.timeTalked[loudMouthIndex]} minutes spent talking.` },
        { name: `The Ghost: ${ghost.displayName}`, value: `${ghost.timeAFK[ghostIndex]} minutes spent AFK.` },
        { name: `The MIA: ${MIA.displayName}`, value: findFurthestDate(MIA.lastTalked[MIAIndex], MIA.lastMessage[MIAIndex]) + " last seen date." },
        { name: `The Summoner: ${summoner.displayName}`, value: `${summoner.summoner[summonerIndex]} summoning rituals completed.` }
    ];


    message.channel.send({ embed: statsEmbed });
}

async function specificStats(message) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    if (message.mentions.members.size < 1)
        message.channel.send("You have to @someone properly!");
    else if (message.mentions.members.first().id == botID)
        message.channel.send("My stats are private!");
    else {

        let specificEmbed = await getStats(message.mentions.members.first());
        specificEmbed.description = message.mentions.members.first().displayName + ", *" + message.member.displayName + "* requested your stats:";
        specificEmbed.thumbnail.url = message.mentions.members.first().user.avatarURL();

        message.channel.send({ embed: specificEmbed });
    }
}

async function getStats(member, user) {

    if (!user)
        user = await findUser({ id: member.id });

    let index = user.guilds.indexOf(member.guild.id);

    if (!user.kicked[index]) {
        let stats = "";


        let statsEmbed = JSON.parse(JSON.stringify(Embed));
        statsEmbed.date = new Date();
        statsEmbed.fields = [
            { name: "Total number of messages sent: ", value: user.messages[index], inline: false },
            { name: "Last message sent: ", value: user.lastMessage[index], inline: false },
            { name: "Total time spent talking (in minutes): ", value: user.timeTalked[index], inline: false },
            { name: "Last time you talked was: ", value: user.lastTalked[index], inline: false },
            { name: "Number of games you are signed up for: ", value: user.games.length, inline: false },
            { name: "Time spent AFK (in minutes): ", value: user.timeAFK[index], inline: false },
            { name: "You joined this server on: ", value: user.dateJoined[index], inline: false },
            { name: "Whether you are excluded from pings: ", value: user.excludePing, inline: false },
            { name: "Whether you are excluded from DMs: ", value: user.excludeDM, inline: false },
            { name: "Number of succesful summons: ", value: user.summoner[index], inline: false },
        ];

        return statsEmbed;
    }
    return -1;
}

async function personalStats(message, params, user) {

    if (message.channel.type != 'dm') {
        let statResult = await getStats(message.member, user);
        statResult.title = Embed.title + ` ${message.member.displayName}'s stats:`
        if (!user.kicked[user.guilds.indexOf(message.guild.id)]) {
            message.channel.send({ embed: statResult });
        }
    }
    else {


        let statsEmbed = JSON.parse(JSON.stringify(Embed));
        statsEmbed.date = new Date();
        statsEmbed.description = ` ${message.author.username} Here Are Your General Stats!`;
        statsEmbed.fields = [
            { name: "The games you are signed up for: ", value: user.games },
            { name: "Whether you are excluded from pings: ", value: user.excludePing },
            { name: "Whether you are excluded from DMs: ", value: user.excludeDM }
        ];

        message.channel.send({ embed: statsEmbed });

        for (let i = 0; i < user.guilds.length; i++) {

            if (!user.kicked[i]) {
                let stats = "";

                let statsEmbed = JSON.parse(JSON.stringify(Embed));
                statsEmbed.date = new Date();
                statsEmbed.description = `Here Are Your Stats For ${message.client.guilds.cache.get(user.guilds[i]).name} Server!`;
                statsEmbed.thumbnail.url = message.client.guilds.cache.get(user.guilds[i]).iconURL();
                statsEmbed.fields = [
                    { name: "Total number of messages sent: ", value: user.messages[i], inline: false },
                    { name: "Last message sent: ", value: user.lastMessage[i], inline: false },
                    { name: "Total time spent talking (in minutes): ", value: user.timeTalked[i], inline: false },
                    { name: "Last time you talked was: ", value: user.lastTalked[i], inline: false },
                    { name: "Time spent AFK (in minutes): ", value: user.timeAFK[i], inline: false },
                    { name: "You joined this server on: ", value: user.dateJoined[i], inline: false },
                    { name: "Number of succesful summons: ", value: user.summoner[i], inline: false },
                ];

                message.channel.send({ embed: statsEmbed });
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

    let foundOne = false;


    let gameEmbed = JSON.parse(JSON.stringify(Embed));

    for (let i = 0; i < searches.length; i++) {

        let query = searches[i];
        if (query.length > 0) {

            let gameEmbed = JSON.parse(JSON.stringify(Embed));
            gameEmbed.date = new Date();
            gameEmbed.description = `Here are the results for: ${query}`;

            let fuse = new Fuse(games, options);
            let result = fuse.search(query);


            let maxResults = 25 < result.length ? 25 : result.length;

            for (let i = 0; i < maxResults; i++) {

                gameEmbed.fields.push({ value: "** **", name: result[i].refIndex + ") " + result[i].item });
                foundOne = true;
            }
            if (result.length < 1)
                message.channel.send(`No matching games were found for: ${query}`)
            else
                message.channel.send({ embed: gameEmbed })
        }

    }//for loop

    if (foundOne)
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

    let miscEmbed = JSON.parse(JSON.stringify(Embed));
    miscEmbed.timestamp = new Date();
    miscEmbed.title = Embed.title + ` Miscellaneous Commands`;
    miscEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(3))
            miscEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: miscEmbed });
}

function helpStats(message, params, user) {


    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = Embed.title + ` Stats Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(2))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}

function helpMusic(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = Embed.title + ` Music Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(4))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i], inline: true });

    message.channel.send({ embed: newEmbed });
}

function gameHelp(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = Embed.title + ` Game Commands`,
        newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}

function generalHelp(message, params, user) {


    const args = message.content.split(" ").slice(1).join(" ");


    if (!args) {
        let newEmbed = JSON.parse(JSON.stringify(Embed));
        newEmbed.timestamp = new Date();
        newEmbed.title = Embed.title + ` General Help`;
        newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;
        newEmbed.fields = [
            { name: "Games", value: "", inline: true },
            { name: "Stats", value: "", inline: true },
            { name: "Miscellaneous", value: "", inline: true },
            { name: "Music", value: "", inline: true },
            { name: "Admins", value: "", inline: true },
            { name: "Quality of Life", value: "", inline: true },
            { name: "Help", value: "", inline: true },
            { name: "General", value: "", inline: true },
            { name: "Tutorials", value: "", inline: true },
            { name: "Bugs/Suggestions", value: "", inline: true },
        ];

        for (tag of tags) {

            for (let i = 0; i < Commands.commands.length; i++) {

                if (Commands.subsection[i].includes(tag)) {

                    newEmbed.fields[tag - 1].value += Commands.commands[i] + "\n"
                }
            }
        }

        return message.channel.send({ embed: newEmbed });
    }

    if (params.index) {

        let examples = "```md\n";

        for (example of Commands.example[params.index]) {

            let index = example.indexOf(" ");
            examples += `<${example.slice(0, index)}` + prefix + `${example.slice(index + 1)}>\n\n`;
        }
        examples += "```";

        let prompt = `${Commands.explanation[params.index]}` + `${examples}`;
        return message.channel.send(prompt);
    }
    else {

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < Commands.commands.length; i++) {

            promptArray.push(Commands.commands[i]);
            internalArray.push({ index: i });
        }
        let query = args;
        console.log(args)
        return generalMatcher(message, query, user, promptArray, internalArray, generalHelp, `Enter the number of the command you wish to learn more about!`);
    }
}

function gameHelp(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = Embed.title + ` Game Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;


    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i], inline: true });

    message.channel.send({ embed: newEmbed });
}

async function guildStats(message, params, user) {

    if (message.channel.type == 'dm') return -1;

    if (!message.channel.permissionsFor(message.member).has("ADMINISTRATOR"))
        return message.channel.send("You do not have the administrator permission to view all member stats!")

    let memberArray = message.guild.members.cache.array();

    for (let i = 0; i < memberArray.length; i++) {

        if (memberArray[i].id != botID) {
            let specificStats = await getStats(memberArray[i]);
            specificStats.description = memberArray[i].displayName + "'s stats.";
            specificStats.thumbnail.url = memberArray[i].user.avatarURL();

            if (specificStats != -1) {
                message.channel.send({ embed: specificStats });
            }
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

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludePing: false } }, function (err, doc, res) { });
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
        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: true } }, function (err, doc, res) { if (err) console.log(err) });
        message.channel.send(mention(message.author.id) + " will be excluded from any further DMs.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: false } }, function (err, doc, res) { if (err) console.log(err) });
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

                message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
                return 0;
            }
            else if (check.result[0].score != 0) {

                let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

                let removeEmbed = JSON.parse(JSON.stringify(Embed));
                removeEmbed.timestamp = new Date();
                removeEmbed.title = Embed.title + ` Game Commands`;
                removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;


                for (suggestion of prettyArray)
                    removeEmbed.fields.push({ name: suggestion, value: "** **" });

                message.channel.send({ embed: removeEmbed });
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


        let finalEmbed = JSON.parse(JSON.stringify(Embed));
        finalEmbed.timestamp = new Date();


        if (invalidGames.length > 0) {
            invalidGames.sort();
            let invalidGameField = { name: "Invalid Game(s)", value: "" };
            for (let i = 0; i < invalidGames.length; i++) {
                invalidGameField.value += (i + 1) + ") " + invalidGames[i];
            }
            finalEmbed.fields.push(invalidGameField);
        }

        if (removedGames.length > 0) {
            removedGames.sort();
            let removedGameField = { name: "Removed Game(s)", value: "" };
            for (let i = 0; i < removedGames.length; i++) {
                removedGameField.value += (i + 1) + ") " + removedGames[i];
            }
            finalEmbed.fields.push(removedGameField);
        }

        message.channel.send({ embed: finalEmbed });


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
        const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");
        if (!args) return message.channel.send("You have to provide the name of a game whose stats you wish to see!");

        let finalEmbed = JSON.parse(JSON.stringify(Embed));
        finalEmbed.timestamp = new Date();

        let check = checkGame(games, params, user);

        if (check == -1) {

            message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
            return 0;
        }
        else if (check.result[0].score != 0) {

            let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);



            let removeEmbed = JSON.parse(JSON.stringify(Embed));
            removeEmbed.timestamp = new Date();
            removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;

            for (suggestion of prettyArray)
                removeEmbed.fields.push({ name: suggestion, value: "** **" });

            message.channel.send({ embed: removeEmbed });
            specificCommandCreator(gameStats, [message, -1, user], check.result, user);
            return -11;
        }
        else {

            game = check.result[0].item;
            console.log(params)
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

        let finalEmbed = JSON.parse(JSON.stringify(Embed));
        finalEmbed.timestamp = new Date();
        finalEmbed.description = "Here are the top stats for " + message.guild.name;
        finalEmbed.thumbnail.url = message.guild.iconURL();

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
            maxResults = params[0] <= 0 ? 5 : params[0];
        if (maxResults > 25) {
            maxResults = 25;
            message.channel.send("Search results are limited to a max of 25 games!");
        }

        if (gameMap.length == 0) {
            message.channel.send(`No one has signed up for any games in ${message.guild.name}, be the first!`);
            return;
        }

        else if (maxResults > gameMap.length && maxResults) {

            maxResults = gameMap.length;
            finalEmbed.description = `There are only ${maxResults} games people signed up for on ${message.guild.name}`;
        }
        else {
            finalEmbed.description = `You did not specify a valid number of games to display, as such, I will display the top ${maxResults}`
                + ` games people signed up for on the ${message.guild.name} server:`;
        }

        for (let i = 0; i < maxResults; i++) {

            finalEmbed.fields.push({ name: `${i + 1}) ${gameMap[i][0]} has ${gameMap[i][1]} user(s) signed up for it.`, value: "** **" })
        }

        message.channel.send({ embed: finalEmbed });
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

    let sizeLimit = message.content.split(',')[1];
    if (sizeLimit)
        sizeLimit.trim();
    let squadSize = !isNaN(sizeLimit) && sizeLimit.length > 0 ? Number(sizeLimit) : 5;
    squadSize = squadSize < 0 ? 5 : squadSize;

    if (game.length > 1 && Array.isArray(game)) {
        game = game[0];
    }

    let check = checkGame(games, game, user);

    if (check == -1) {

        message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
        return 0;
    }
    else if (check.result[0].score != 0) {

        let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

        let removeEmbed = JSON.parse(JSON.stringify(Embed));
        removeEmbed.timestamp = new Date();
        removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;


        for (suggestion of prettyArray)
            removeEmbed.fields.push({ name: suggestion, value: "** **" });

        message.channel.send({ embed: removeEmbed });
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
                                    signedUp += mention(user.id) + " ";
                                if (user.excludeDM == false)
                                    directMessage(message, user.id, game);
                            }
                        }
                        else if (user.games.includes(games[game])) {
                            if (user.excludePing == false)
                                signedUp += mention(user.id) + " ";
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

        let finalEmbed = JSON.parse(JSON.stringify(Embed));
        finalEmbed.timestamp = new Date();
        finalEmbed.description = message.member.displayName + " has summoned " + signedUp + " for some " + game
            + "```fix\n" + `To accept the summons type ${prefix}q` + "```";

        if (signedUp.length > 3) {

            //into players put yourSELF!!!! NOTE note
            squads.set(user.id, { game: game, players: [mention(user.id)], displayNames: [user.displayName], size: squadSize, created: new Date(), summoner: user.displayName });
            message.channel.send({ embed: finalEmbed });
        }
        else
            message.channel.send("No one has signed up for " + game + ".");
        let index = user.guilds.indexOf(message.guild.id);
        user.summoner[index] += 1;
        User.findOneAndUpdate({ id: user.id }, { $set: { summoner: user.summoner } }, function (err, doc, res) { });
        return 1;
    }
}

async function Queue(message, params, user) {

    if (squads.size == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

    let ETA = message.content.split(',')[1];
    if (ETA)
        ETA.trim();
    let finalETA = !isNaN(ETA) && ETA.length > 0 ? Number(ETA) : -1;
    if (finalETA < 0)
        finalETA = -1;

    if (squads.size == 1 || params.summon) {
        let squad = params.summon ? params.summon : squads.values().next().value;
        if (squad.players.length < squad.size - 1) {

            if (squad.players.includes(mention(user.id))) return message.channel.send("You have already joined this summon!");

            squad.players.push(mention(user.id));
            squad.displayNames.push(user.displayName);
            let newEmbed = JSON.parse(JSON.stringify(Embed));
            newEmbed.description = (finalETA == -1) ? `${mention(user.id)} has joined the summon!` : `${mention(user.id)} is arriving, they will be there in ${finalETA} minutes!`;
            newEmbed.fields = [{ name: `Current summons members: ${squad.players.length}/${squad.size}`, value: squad.players }];
            return message.channel.send({ embed: newEmbed });
        }
        else return message.channel.send("There is no space left in the summon!");
    }
    else if (message.mentions.members.size > 0) {

        let squad = squads.get(message.mentions.members.values().next().value.id);
        if (!squad) return message.channel.send("That user does not have any active summoninings!");
        if (squad.players.length < squad.size - 1) {

            if (squad.players.includes(mention(user.id))) return message.channel.send("You have already joined this summon!");

            squad.players.push(mention(user.id));
            let newEmbed = JSON.parse(JSON.stringify(Embed));
            newEmbed.description = (finalETA == -1) ? `${mention(user.id)} has joined the summon!` : `${mention(user.id)} is arriving, they will be there in ${finalETA} minutes!`;
            newEmbed.fields = [{ name: `Current squad members: ${squad.players.length}/${squad.size}`, value: squad.players }];
            return message.channel.send({ embed: newEmbed });
        }
        else return message.channel.send("There is no space left in the summon!");
    }
    else {

        let searchArray = [];
        let internalArray = [];

        for (let squad of squads.entries()) {
            searchArray.push(`${squad[1].summoner}'s Summon: ${squad[1].players.length}/${squad[1].size}`);
            internalArray.push({ summon: squad[1] });
        }

        return generalMatcher(message, -23, user, searchArray, internalArray, Queue, "There are more than one active summon, please enter the number whose summon you wish to answer!");
    }
}

async function deQueue(message, params, user) {

    if (squads.size == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

    let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;

    if (mentionID != -1) {

        let squad = squads.get(mentionID);
        if (!squad) return message.channel.send(`${mention(mentionID)} doesn't have a summon!`);
        if (squad.summoner == user.displayName) {
            message.channel.send("You have cancelled your summon!");
            return squads.clear();
        }
        message.channel.send(`Left ${squad.summoner}'s summon!`);
        squad.displayName.splice(squad.players.indexOf(mentionID), 1);
        return squad.players.splice(squad.players.indexOf(mentionID), 1);
    }
    else {
        for (let squad of squads.entries())
            if (squad[1].summoner == user.displayName)
                squads.delete(squad[0])
            else if (squad[1].players.includes(mention(user.id))) {
                squad[1].displayName.splice(squad[1].players.indexOf(mentionID), 1);
                squad[1].players.splice(squad[1].players.indexOf(mention(user.id)), 1);
            }

        return message.channel.send("You have destroyed any of your active summons!");
    }
}

async function viewActiveSummons(message, params, user) {

    if (squads.size == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.description = `There are ${squads.size} active summons!`;

    for (let squad of squads.entries()) {
        newEmbed.fields.push({ name: `${squad[1].summoner}'s Summon: ${squad[1].players.length}/${squad[1].size}`, value: squad[1].players, inline: true });
    }

    message.channel.send({ embed: newEmbed });
}

async function banish(message, params, user) {

    if (!squads.get(user.id)) return message.channel.send("You don't have any active summons to kick from!");
    let squad = squads.get(user.id);
    let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;

    if (mentionID != -1) {

        if (mentionID == user.id) return message.channel.send("You can't banish yourself from the summon, use the dq command instead!");
        for (let squad of squads.entries())
            if (squad[1].summoner == user.displayName)
                return message.channel.send(`${squad[1].players.splice(squad[1].players.indexOf(mention(mentionID)), 1)} has been banished from your summon!`);
        message.channel.send("Either you don't have an active summon or such player wasn't part of it!");
    }
    else if (params.player) {

        squad.players.splice(squad.displayNames.indexOf(params.player), 1);
        return message.channel.send(`${squad.displayNames.splice(squad.displayNames.indexOf(params.player), 1)} has been banished from your summon!`);
    }
    else {

        let searchArray = [];
        let internalArray = [];

        for (let i = 0; i < squad.players.length; i++) {

            if (squad.displayNames[i] != user.displayName) {
                searchArray.push(squad.displayNames[i]);
                internalArray.push({ player: squad.displayNames[i] });
            }
        }

        if (searchArray.length == 0) return message.channel.send("There is no one to banish from your summon!");

        return generalMatcher(message, -23, user, searchArray, internalArray, banish, "Enter the number of the player you wish to banish from your summon!");
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
        console.log("The user doesnt exist. " + member.displayName);
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

function hmsToSecondsOnly(str) {

    str = String(str).trim();
    var p = str.split(':'),
        s = 0, m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

function timeConvert(time) {

    let seconds = Math.floor(time % 60);
    if ((seconds + "").length < 2) seconds = '0' + seconds;
    let minutes = Math.floor(time / 60 % 60);
    if ((minutes + "").length < 2) minutes = '0' + minutes;
    console.log((minutes + "").length)
    let hours = Math.floor(time / 60 / 60);
    if (("" + hours).length < 2) hours = '0' + hours;

    let finalTime = seconds;
    if (minutes > 0) finalTime = minutes + `:${finalTime}`;
    if (hours > 0) finalTime = hours + `:${finalTime}`;
    return finalTime;
}

async function pause(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    let guildQueue = queue.get(message.guild.id);
    if (guildQueue) {
        let song = guildQueue.songs[guildQueue.index];
        if (!song.paused) {
            song.paused = new Date();
        }
        guildQueue.dispatcher.pause();
    }

}

async function resume(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {

        let song = guildQueue.songs[guildQueue.index];
        if (song.paused) {

            song.timePaused = (new Date() - song.paused) / 1000 + song.timePaused;
            song.paused = null;
        }
        queue.get(message.guild.id).dispatcher.resume();
    }
}

async function skip(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    let skipy = lastSkip.get(message.guild.id);
    if (guildQueue) {

        console.log(((new Date()) - skipy) <= 200)
        if (!skipy) lastSkip.set(message.guild.id, new Date());
        if (((new Date()) - skipy) <= 1000) {
            console.log("Chill corner")
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        lastSkip.set(message.guild.id, new Date());

        if (!isNaN(params))
            if ((guildQueue.index + Number(params)) >= guildQueue.songs.length || (guildQueue.index + Number(params)) < 0)
                return message.channel.send(`You're trying to skip too many songs!`);
            else { guildQueue.index += Number(params); }
        else if (params == prefix + 'skip');
        guildQueue.index++;

        console.log(`after: ${guildQueue.index}`)
        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}

async function reverse(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {

        if (!isNaN(params))
            if ((guildQueue.index - Number(params)) >= guildQueue.songs.length || (guildQueue.index - Number(params)) < 0)
                return message.channel.send(`You're trying to reverse too many songs!`);
            else { guildQueue.index -= Number(params); }
        else if (params == prefix + 'skip');
        guildQueue.index--;

        console.log(`after: ${guildQueue.index}`)
        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}

async function stop(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) {
        //queue.get(message.guild.id).dispatcher.destroy();
        queue.get(message.guild.id).voiceChannel.leave();
        queue.delete(message.guild.id);
        download.delete(message.guild.id);
    }
}

async function forward(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    let song = guildQueue.songs[guildQueue.index];

    if (guildQueue) {

        if (Array.isArray(params)) params = params[0];
        console.log(params)
        console.log("BRUH: " + /^[:0-9]+$/.test(params))
        if (!/^[:0-9]+$/.test(params)) return message.channel.send("You have entered an invalid forward format!");

        let newSkip = !isNaN(params) ? Number(params) : hmsToSecondsOnly(params);

        if (newSkip + song.offset > song.duration || newSkip + song.offset < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {
            song.offset = song.start ? ((new Date() - song.start) / 1000) + song.offset - (song.timePaused / 1000) + newSkip : song.offset;
            //song.start = new Date();
            let skipMessage = await message.channel.send(`Skipping to ${timeConvert(Math.floor(song.offset))}`)//convert this to a time stamp later
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, skipMessage);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}

async function rewind(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    let song = guildQueue.songs[guildQueue.index];

    if (guildQueue) {

        if (Array.isArray(params)) params = params[0];
        console.log(params)
        console.log("BRUH: " + /^[:0-9]+$/.test(params))
        if (!/^[:0-9]+$/.test(params)) return message.channel.send("You have entered an invalid rewind format!");

        let newSkip = !isNaN(params) ? Number(params) : hmsToSecondsOnly(params);

        if (song.offset - newSkip > song.duration || song.offset - newSkip < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {
            song.offset = song.start ? ((new Date() - song.start) / 1000) + song.offset - (song.timePaused / 1000) - newSkip : song.offset;
            song.start = new Date();
            let skipMessage = await message.channel.send(`Skipping to ${timeConvert(Math.floor(song.offset))}`)//convert this to a time stamp later
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, skipMessage);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}

async function seek(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    let song = guildQueue.songs[guildQueue.index];

    if (guildQueue) {

        if (Array.isArray(params)) params = params[0];
        console.log(params)
        console.log("BRUH: " + /^[:0-9]+$/.test(params))
        if (!/^[:0-9]+$/.test(params)) return message.channel.send("You have entered an invalid seek format!");
        let newSkip = isNaN(params) ? hmsToSecondsOnly(params) : Number(params);

        if (newSkip > song.duration || newSkip < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {
            song.offset = newSkip;
            song.start = new Date();
            let skipMessage = await message.channel.send(`Skipping to ${timeConvert(Math.floor(song.offset))}`)
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, message);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}

async function generalMatcher(message, params, user, searchArray, internalArray, originalCommand, flavourText) {

    if (Array.isArray(params)) {
        params = params[0].trim();
    }
    else if (isNaN(params)) {
        params = params.trim();
    }

    let promptArray = new Array();
    let parameterArray = new Array();

    let newOptions = JSON.parse(JSON.stringify(options));
    newOptions = {
        ...newOptions,
        minMatchCharLength: params.length / 2,
        findAllMatches: false,
        includeScore: true,
        isCaseSensitive: false,
        includeMatches: true
    }

    if (params != -23) {
        let fuse = new Fuse(searchArray, newOptions);
        let result = fuse.search(params);

        if (result[0])
            if (result[0].score == 0) {
                return originalCommand.apply(null, [message, internalArray[result[0].refIndex], user]);
            }

        let maxResults = 5;
        if (maxResults > result.length)
            maxResults = result.length;

        for (let i = 0; i < maxResults; i++) {

            parameterArray.push({ item: internalArray[result[i].refIndex] });
            promptArray.push(result[i]);
        }
    }
    else {

        for (let i = 0; i < internalArray.length; i++) {
            parameterArray.push({ item: internalArray[i] });
            promptArray.push({ item: searchArray[i] });
        }
    }

    if (promptArray.length > 0) {

        let fieldArray = new Array();

        for (let i = 0; i < promptArray.length; i++)
            fieldArray.push({ name: `${i}) ` + promptArray[i].item, value: "** **", inline: false })

        let newEmbed = JSON.parse(JSON.stringify(Embed));
        newEmbed.timestamp = new Date();
        newEmbed.description = flavourText;
        newEmbed.fields = fieldArray;

        message.channel.send({ embed: newEmbed })
        specificCommandCreator(originalCommand, [message, -1, user], parameterArray, user);
        return 0;

    }
    else {
        message.channel.send(`You have entered an invalid suggestion number/input please try again.`);
        return -1
    }
}

/*
params = {
    custom = true/false,
    url: "Asdasdas"
}
*/
async function play(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (!params) return message.reply("You need to provide a song to play!");
    let serverQueue = queue.get(message.guild.id);
    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const memberPermissions = voiceChannel.permissionsFor(message.author);
    if (!memberPermissions.has('CONNECT') || !memberPermissions.has("SPEAK")) {
        return message.channel.send("You need permission to join and speak in your voice channel!");
    }

    let callPlay = false;
    let queueConstruct;

    if (!serverQueue) {
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            index: 0,
            volume: 5,
            playing: true,
            dispatcher: null
        };
        queue.set(message.guild.id, queueConstruct);
        serverQueue = queueConstruct;
    } else {

        queueConstruct = serverQueue;
    }

    let songInfo;

    if (await ytpl.validateURL(args)) {
        //ytpl
        let playlist = await ytpl(args, { limit: 0 });
        for (Video of playlist.items) {
            if (Video.duration) {
                let video = JSON.parse(JSON.stringify(Video))
                let song = {
                    title: video.title,
                    url: video.url_simple,
                    duration: hmsToSecondsOnly(video.duration),
                    start: null,
                    offset: 0,
                    id: video.id,
                    paused: null,
                    timePaused: 0,
                    progress: 0
                }

                queueConstruct.songs.push(song);
                cacheSong(song, message.guild.id);
            }
        } callPlay = true;
        message.channel.send(`${playlist.items.length} songs have been added to the queue!`);
    }
    else if (ytdl.validateURL(args)) {
        songInfo = await ytdl.getInfo(args, { quality: 'highestaudio' });
        if (songInfo.length_seconds) {
            let startTime = args.lastIndexOf('?t=');
            let offset = 0;

            if (startTime != -1) {

                let tester = args.substring(startTime + 3);
                offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
            }

            let song = {
                title: songInfo.title,
                url: songInfo.video_url,
                duration: songInfo.length_seconds,
                start: null,
                offset: offset,
                id: songInfo.video_id,
                paused: null,
                timePaused: 0,
                progress: 0
            };
            queueConstruct.songs.push(song);
            cacheSong(song, message.guild.id);

            if (queueConstruct.songs.length > 1) message.channel.send(`${songInfo.title} has been added to the queue!`)
            else {
                message.channel.send(`Now playing ${songInfo.title}!`)
                callPlay = true;
            }
        }
        else
            message.channel.send("I can't access that video, please try another!");
    }
    else {
        let searchResult = await ytsr(args, { limit: 10 });

        let titleArray = [];
        let urlArray = [];

        for (let i = 0; i < searchResult.items.length || titleArray.length == 5; i++) {

            if (searchResult.items[i].type == 'video') {
                titleArray.push(searchResult.items[i].title);
                urlArray.push({ url: searchResult.items[i].link, custom: true });
            }
        }

        return generalMatcher(message, searchResult.query, user, titleArray, urlArray, play, "Please enter the number matching the video you wish to play!");
    }

    if (callPlay) {
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0], null, message);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id)
            return message.channel.send("There was an error playing! " + err);
        }
    }
}
//addsong or addplaylist will check if parameters is given, then offer to make new playlist or add to existing one.



//filter: format => format.container === 'mp4' && !format.qualityLabel,

async function playSong(guild, sonG, skip, message) {
    const serverQueue = queue.get(guild.id);
    const song = sonG;

    if (!song) {
        message.channel.send(`No more songs queued, leaving!`);
        stop(message);
        return;
    }

    let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');
    let audioOutputExists = false;
    await fsPromises.access(audioOutput)
        .then(() => { audioOutputExists = true; })
        .catch(() => { })

    if (!song.start && (song.offset > 0) && !audioOutputExists && !skip) return forward(message, song.offset)

    if (audioOutputExists) {

        const Dispatcher = await serverQueue.connection.play(audioOutput, { seek: song.offset })
            .on('error', error => {
                console.log("Error inside of dispatcher playing?: ", error);
            })
            .on('finish', () => {

                //serverQueue.songs.shift();
                serverQueue.index++;
                if (serverQueue.index == serverQueue.songs.length)
                    serverQueue.songs = [];

                playSong(guild, serverQueue.songs[serverQueue.index], null, message);
            })
            .on('start', () => {

                if (!song.start)
                    song.start = new Date();
                if (activeSkips.get(song.id)) activeSkips.delete(song.id);
            })


        Dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.dispatcher = Dispatcher;
    }
    else if (skip) {

        let percentageToDownload = 100 - download.get(guild.id).progress;
        let percentageToSkip = (song.offset / song.duration) * 100;

        console.log(`toDownload ${percentageToDownload} || toSkip ${percentageToSkip}`);

        if ((percentageToSkip > percentageToDownload) && (download.get(guild.id).songToDownload.id == song.id)) {
            console.log(console.log("chose to wait"));

            return setTimeout(playSong, 1000, guild, song, skip, message);
        }
        else {
            return playSong(guild, song, null, message)
        }
    }
    else {
        console.log("inside of else", song.url, song.title);

        //Create a seperate read stream solely for buffering the audio so that it doesn't hold up the previous write stream

        let streamResolve = await ytdl(song.url, { format: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });

        const Dispatcher = await serverQueue.connection.play(streamResolve, { seek: song.offset })
            .on('error', error => {
                console.log("inside of error   ", error);
            })
            .on('finish', () => {

                serverQueue.index++;
                if (serverQueue.index == serverQueue.songs.length)
                    serverQueue.songs = [];

                playSong(guild, serverQueue.songs[serverQueue.index], null, message);
            })
            .on('start', () => {

                if (!song.start)
                    song.start = new Date()
                if (activeSkips.get(song.id)) activeSkips.delete(song.id);
            })

        Dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.dispatcher = Dispatcher;
    }
}

//make a queue system for a max of 20 songs at a time.
/**
 * 
 * @param {id: link id, url: youtubelink} song 
 */
async function cacheSong(song, guild) {

    if (!download.get(guild) && song) {

        download.set(guild,
            {
                songToDownload: null,
                progress: 0,
                leftOver: [JSON.parse(JSON.stringify(song))]
            }
        );
    }

    let serverDownload = download.get(guild);
    if (!serverDownload) return -1;
    if (!serverDownload.songToDownload && serverDownload.leftOver.length > 0) {

        serverDownload.songToDownload = serverDownload.leftOver.shift();
        song = serverDownload.songToDownload;

        let tempAudio = path.resolve(`songs`, song.id + '.mp3');
        let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');

        let audioExists = false;
        let tempAudioExists = false;

        await fsPromises.access(audioOutput)
            .then(() => { audioExists = true; })
            .catch(() => { })

        await fsPromises.access(tempAudioExists)
            .then(() => { tempAudioExists = true; })
            .catch(() => { })

        if (audioExists) {
            serverDownload.songToDownload = null;
            serverDownload.progress = 0;
            cacheSong(null, guild);
            return;
        }

        if (!tempAudioExists && !audioExists) {
            console.log("interesting")

            let downloadYTDL = require('ytdl-core');
            let youtubeResolve = downloadYTDL(song.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
            let writeStream = fs.createWriteStream(tempAudio);
            writeStream.on('finish', () => {
                console.log("FINISHED: WRITE STREAM " + song.title);
                mv(tempAudio, audioOutput, function (err) {
                    if (err) console.log(err);
                    serverDownload.songToDownload = null;
                    serverDownload.progress = 0;
                    cacheSong(null, guild);
                });
            });

            youtubeResolve.on('progress', (chunkLength, downloaded, total) => {
                const percent = downloaded / total;
                readline.cursorTo(process.stdout, 0);
                song.progress = Math.floor((percent * 100).toFixed(2));
                if (download.get(guild))
                    download.get(guild).progress = song.progress;
            });
            youtubeResolve.pipe(writeStream);
        }
    }
    else if (song) {
        serverDownload.leftOver.push(JSON.parse(JSON.stringify(song)));
    }

}

/**
 * 
 * step:
 * -1 - quit
 * 1) put the song in a provided playlist
 * 2) They chose a search result and a freaking playlist
 */
async function addSong(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

    let serverQueue = queue.get(message.guild.id);
    let song;

    if (!params.step)
        params = params.url && !params.step ? params.url : message.content.split(" ").slice(1).join(" ");

    if (!params.step) {

        if (!params && !serverQueue) return message.channel.send("There is no song currently playing"
            + " and you have not provided a url/search term. Make sure at least one of those exsit before adding a song!");
        else if (!params) {
            song = serverQueue.songs[serverQueue.index];
        }
        else if (ytdl.validateURL(params)) {
            songInfo = await ytdl.getInfo(params, { quality: 'highestaudio' });

            if (songInfo.length_seconds) {
                let startTime = params.lastIndexOf('?t=');
                let offset = 0;

                if (startTime != -1) {

                    let tester = params.substring(startTime + 3);
                    offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
                }

                song = {
                    title: songInfo.title,
                    url: songInfo.video_url,
                    duration: songInfo.length_seconds,
                    start: null,
                    offset: offset,
                    id: songInfo.video_id,
                    paused: null,
                    timePaused: 0,
                    progress: 0
                };
            }
            else
                message.channel.send("I can't access that video, please try another!");
        }
        else {
            let searchResult = await ytsr(params, { limit: 10 });

            let titleArray = [];
            let urlArray = [];

            for (let i = 0; (i < searchResult.items.length) && (titleArray.length != 5); i++) {

                if (searchResult.items[i].type == 'video') {
                    titleArray.push(searchResult.items[i].title);
                    urlArray.push({ url: searchResult.items[i].link });
                }
            }
            return generalMatcher(message, searchResult.query, user, titleArray, urlArray, addSong, "Please enter the number matching the song you wish to add!");
        }

        let titleArray = [];
        let internalArray = [];
        for (let i = 0; i < user.playlists.length; i++) {

            titleArray.push(user.playlists[i].title);
            internalArray.push({ step: 1, playlist: user.playlists[i], index: i, song: song });
        }
        return generalMatcher(message, -23, user, titleArray, internalArray, addSong,
            "Enter the number associated with the playlist you wish to add the song to");
    }
    else {
        params.playlist.songs.push(params.song);
        user.playlists[params.index] = params.playlist;
        message.channel.send(`Succesfully added ${params.song.title} to ${params.playlist.title}`)
        return User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
    }
}

async function savePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

    let serverQueue = queue.get(message.guild.id);
    let song;

    if (!params.playlist)
        params = params.url && !params.step ? params.url : message.content.split(" ").slice(1).join(" ");

    if (!params.playlist) {

        if (!serverQueue) return message.channel.send("No songs are currently playing, start some before trying to add them to a playlist.");

        let titleArray = [];
        let internalArray = [];
        for (let i = 0; i < user.playlists.length; i++) {

            titleArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i], index: i, });
        }

        let query = params ? params : -23;
        return generalMatcher(message, params, user, titleArray, internalArray, savePlayList,
            "Enter the number associated with the playlist you wish to add the song to");
    }
    else {

        for (song of serverQueue.songs) {
            params.playlist.songs.push(JSON.parse(JSON.stringify(song)));
        }

        user.playlists[params.index] = params.playlist;
        message.channel.send(`Succesfully added ${serverQueue.songs.length} songs to ${params.playlist.title}`)
        return User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
    }
}

async function removeSong(message, params, user) {

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists!");

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");
    let playListEmbed = JSON.parse(JSON.stringify(Embed));
    playListEmbed.timestamp = new Date();

    if (params.song) {

        params.playlist.songs.splice(params.index, 1);
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { if (err) console.log(err) });
        return 100;
    }
    else if (params.playlist) {

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < params.playlist.songs.length; i++) {
            promptArray.push(params.playlist.songs[i].title);
            internalArray.push({ playlist: params.playlist, song: params.playlist.songs[i], index: i });
        }
        return generalMatcher(message, -23, user, promptArray, internalArray, removeSong, `Enter the number of the song you wish to remove from ${params.playlist.title}`);

    } else {

        let playlists = [];
        let internalArray = [];
        for (playlist of user.playlists) {
            playlists.push(playlist.title);
            internalArray.push({ playlist: playlist });
        }
        let query = params ? params : -23;
        return generalMatcher(message, query, user, playlists, internalArray, removeSong, `Enter the number of the playlist you wish to remove the song from!`);
    }
}

async function playlist(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");
    let serverQueue = queue.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const memberPermissions = voiceChannel.permissionsFor(message.author);
    if (!memberPermissions.has('CONNECT') || !memberPermissions.has("SPEAK")) {
        return message.channel.send("You need permission to join and speak in your voice channel!");
    }

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");

    if (params.playlist) {
        let callPlay = false;
        let queueConstruct;

        if (!serverQueue) {
            queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                index: 0,
                volume: 5,
                playing: true,
                dispatcher: null
            };
            queue.set(message.guild.id, queueConstruct);
            serverQueue = queueConstruct;
            callPlay = true;
        } else {

            queueConstruct = serverQueue;
        }

        for (video of params.playlist.songs) {
            if (video.duration) {
                queueConstruct.songs.push({
                    ...video,
                    start: null,
                });
                cacheSong({ id: video.id, url: video.url });
            }
        }
        message.channel.send(`${params.playlist.songs.length} songs have been added to the queue!`);

        if (callPlay) {
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                playSong(message.guild, queueConstruct.songs[0], null, message);
            } catch (err) {
                console.log(err);
                queue.delete(message.guild.id)
                return message.channel.send("There was an error playing! " + err);
            }
        }
    }
    else {
        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i] });
        }
        let query = params ? params : -23;
        return generalMatcher(message, query, user, promptArray, internalArray, playlist, `Enter the number of the playlist you wish to load the songs from!`)
    }
}

async function removePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");

    if (params.playlist) {

        message.channel.send(`${params.playlist.title} has been deleted!`);
        user.playlists.splice(params.index, 1);
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
    }
    else {
        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i] });
        }
        let query = params ? params : -23;
        return generalMatcher(message, query, user, promptArray, internalArray, removePlayList, `Enter the number of the playlist you wish to delete!`)
    }
}

async function myPlayLists(message, params, user) {

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists!");

    params = params.title ? params : message.content.split(" ").slice(1).join(" ");

    let playListEmbed = JSON.parse(JSON.stringify(Embed));
    playListEmbed.timestamp = new Date();

    if (!params) {

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push(user.playlists[i]);
        }
        return generalMatcher(message, -23, user, promptArray, internalArray, myPlayLists, `Enter the number of the playlist you wish to view more information about!`)
    }
    else if (params.title) {

        let fields = [];

        for (let i = 0; i < params.songs.length; i++) {

            fields.push({ name: `${i}) ${params.songs[i].title}`, value: "** **" });
        }

        playListEmbed.fields = fields;
        playListEmbed.description = `Here are the songs for **${params.title}**`;
        return message.channel.send({ embed: playListEmbed });
    } else {

        let playlists = [];
        for (playlist of user.playlists)
            playlists.push(playlist.title);

        return generalMatcher(message, params, user, playlists, user.playlists, myPlayLists, `Enter the number of the playlist you wish to view more information about!`);
    }
}

function createPlaylist(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    if (message.content.toLowerCase() == (prefix + "createplaylist")) return message.channel.send("You need to provide a name for the new playlist.")

    let newName = message.content.split(" ").slice(1).join(" ").trim();

    if (newName.length == 0) return message.channel.send("You can't have a blank for the playlist name!");

    if (user.playlists.some((value) => { return value.title == newName })) return message.channel.send(`You already have a playlist called ${newName}`);

    user.playlists.push({ title: newName, songs: [] })
    User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });

    message.channel.send(`${newName} has been created!`);
}

function skippingNotification(message, songID, step) {

    if (activeSkips.get(songID)) {

        if (step == 1) {
            message.edit(message.content + " :musical_note:");
            step = 2;
        }
        else {
            message.edit(message.content + " :notes:");
            step = 1;
        }

        setTimeout(skippingNotification, 3000, message, songID, step);

    }
    else {
        message.delete();
    }
}

async function removeLastModifiedSong() {

    const directory = path.join(__dirname, `songs`);
    let song;
    await fs.readdir(directory, async (err, files) => {
        if (err) throw err;

        for (const file of files) {
            if (file != "finished") {

                let stats = fs.statSync(path.join(directory, file));

                if (!song) song = { file: path.join(directory, file), time: stats.aTimeMs }

                if (stats.aTimeMs < song.time) song = { file: path.join(directory, file), time: stats.aTimeMs }

            }
        }
        if (song)
            fs.unlink(song.file, () => { });
    });
}

async function removeTempSongs() {
    const directory = path.join(__dirname, `songs`);
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {

            if (file != "finished") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    });
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

    //     // for(let i = 0; i < user.dateJoined.length; i++){

    //     //     let splity = user.dateJoined[i].split('-');
    //     //     splity[1] = splity[1].length == 1 ? "0" + splity[1] : splity[1];
    //     //     user.dateJoined[i] = splity.join("-");
    //     // }

    //     // console.log(user.dateJoined);
    //     // await User.findOneAndUpdate({id: user.id}, {$set: {dateJoined: user.dateJoined}}, function(err, doc, res){});

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


    //     // let tempArr = [];

    //     // for(let i = 0; i < user.guilds.length; i++){

    //     //     tempArr.push("-1");
    //     // }


    //     // await User.findOneAndUpdate({id: user.id}, {$set: {prefix: tempArr}, defaultPrefix: "-1"}, function(err, doc, res){});

    // }//for user loop

    // // fs.writeFile(__dirname + "/backups/" + getDate() + ".json", JSON.stringify(users), function (err, result) {
    // //     if (err) console.log('error', err);
    // // });

    // console.log("CALLED UPDATE ALL");
}

async function minuteCount() {
    countTalk();

    //Checking for squad timeouts
    {
        for (squad of squads.entries())
            if ((new Date() - squad[1].created) >= 1, 800, 000)
                squads.delete(squad[0]);

    }
}

async function updateGames(message, game, user) {

    if (Array.isArray(game)) {
        let setty = new Set(game);
        game = Array.from(setty);
    }
    else {
        game = [game];
    }

    const args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to provide the name or number of a game for which you want to signUp for!");

    games.sort();
    let existingGames = user.games;
    let finalGameArray = new Array();
    let alreadyTracked = new Array();
    let invalidGames = new Array();

    if (game.length == 1) {

        let check = checkGame(games, game, user);

        if (check == -1) {

            message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
            return 0;
        }
        else if (check.result[0].score != 0) {

            let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);
            let removeEmbed = JSON.parse(JSON.stringify(Embed));
            removeEmbed.date = new Date();
            removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;


            for (suggestion of prettyArray)
                removeEmbed.fields.push({ name: suggestion, value: "** **" });

            message.channel.send({ embed: removeEmbed });
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

    let finalEmbed = JSON.parse(JSON.stringify(Embed));
    finalEmbed.timestamp = new Date();

    if (finalGameArray.length > 0) {
        finalGameArray.sort();
        let signedField = { name: "Game(s) Succesfully Signup For:", value: "" };
        for (let i = 0; i < finalGameArray.length; i++) {
            signedField.value += (i + 1) + ") " + finalGameArray[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    if (alreadyTracked.length > 0) {
        alreadyTracked.sort();
        let signedField = { name: "Game(s) Already Tracked For You:", value: "" };
        for (let i = 0; i < alreadyTracked.length; i++) {
            signedField.value += (i + 1) + ") " + alreadyTracked[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    if (invalidGames.length > 0) {
        invalidGames.sort();
        let signedField = { name: "Invalid Game(s):", value: "" };
        for (let i = 0; i < invalidGames.length; i++) {
            signedField.value += (i + 1) + ") " + invalidGames[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    message.channel.send({ embed: finalEmbed });

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

    return length;
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
    let newOptions = JSON.parse(JSON.stringify(options));
    newOptions = {
        ...newOptions,
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


//Test horoku allocation by playing my 500 list song and have it try to dl all of that

//forcefuly sign up a user, and everyone.


//DM quality of life (for now its just prefixes?) - prefix tutorial
//for game stats, add a Y/N for seeing a list of all the people signed up for it

//make a game recommendation

//add playlist stats to all stats

//make custom 'command prefixes' possible


//for the game tutorial add a continuation showing the remaining extra commands, they can either cover them or skip them - make it Y/N
//if they dont, they can always start it by saying prefixADVANCEDGAMETUTORIAL - which is a seperate tutorial all together. If they want to do it to type that command



//For game stats and top games, you can list the people under each heading!!! Make sure to add a limit of 25 fields/games!!!

//Be alerted if a user is found in a voice channel? Stalker lmao
//play https://www.youtube.com/watch?v=cKzFsVfRn-A when sean joins, then kick everyone.

//poker, texas hold em, war, gold fish, 

//make a text channel for logs

//Stats Tutorial

//don't ping someone else in the same voice channel....

//coin flipper
//game decider
//roll command - for however many sided die
//ping-pong command
//add a timer
//shake user # of times -> have to check for move user perms

//Then make a tutorial for the above commands...

//moment.js for converting time zones???


//look into start typing in message documentation to make it feel more alive?

//make remove game array - it is but broken - ez fix, mark all the spots with -1, then splice out all of them



//Make the youtube player complete (at least youtube)
//youtube live streams are broken 


//Twitch notification/signup when a streamer goes live -> npm module for it?
//https://dev.twitch.tv/docs/api/reference/#get-streams
//add streamer stats



//Make a vote system for the next feature to focus on
//MEE6 bot - beatiful ui, mainly the website

//seal idan easter eggs
process.on('unhandledRejection', (reason, p) => { console.log("FFFFFF"); console.log(reason) });
process.on('unhandledException', (reason, p) => { console.log(";;;;;;;;;;;;;;;;;;"); console.log(reason) });