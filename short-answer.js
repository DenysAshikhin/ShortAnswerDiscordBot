const Discord = require('discord.js');
const User = require('./User.js');
const Guild = require('./Guild.js')
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const Commands = require('./commands.json');
const DATABASE = require('./backups/26-04-2020.json');
const fs = require('fs');
const STATS = require('./stats.js');
const MISCELLANEOUS = require('./miscellaneous.js')
const GAMES = require('./games.js');
const MUSIC = require('./music.js');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


const logID = '712000077295517796';
exports.logID = logID;
const creatorID = '99615909085220864';
exports.creatorID = creatorID;
const botID = '689315272531902606';
exports.botID = botID;
const guildID = '97354142502092800';
exports.guildID = guildID;


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
        GAMES.search,
        GAMES.updateGames,
        GAMES.updateGames,
        GAMES.personalGames,
        GAMES.removeGame,
        GAMES.pingUsers,
        GAMES.excludePing,
        GAMES.excludeDM
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
exports.options = options;

const Embed = {
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
exports.Embed = Embed;


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
exports.Client = Client;
var commandMap = new Map();
var commandTracker = new Map();
var config = null;


var timers = new Map();
var defaultPrefix = "sa!";
var prefix;
exports.prefix = prefix;
var uri = "";
var token = "";
var lastMessage;

try {
    config = require('./config.json');
}
catch (err) {
    console.log("config.json doesn't exist - probably running on heroku?");
}

if (process.argv.length == 3) {

    uri = config.uri;
    token = config.token;
}
else {
    uri = config.uri;
    token = config.TesterToken;
    defaultPrefix = "##";
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const connectDB = mongoose.connection;

const getUsers = async function () {
    try {
        return await User.find({})
    } catch (err) {
        console.log(err);
        Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err);
    }
}
exports.getUsers = getUsers;

const findUser = async function (params) {
    try {
        return await User.findOne(params)
    } catch (err) {
        console.log(err);
        Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err);
    }
}
exports.findUser = findUser;

const findGuild = async function (params) {
    try {
        return await Guild.findOne(params)
    } catch (err) {
        console.log(err);
        Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err);
    }
}
exports.findGuild = findGuild;


connectDB.once('open', async function () {

    await Client.login(token);

    updateAll();
    populateCommandMap();


    // for (let i = 0; i < commandMap.size; i++) {

    //     if (Commands.subsection[i].includes(4))
    //         console.log(Commands.commands[i])
    // }




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

        lastMessage = message.content;

        if (defaultPrefix == "##")
            prefix = "##";

        if (message.content.substr(0, prefix.length) == prefix) {

            if (message.channel.type != 'dm') {
                let permission = message.channel.permissionsFor(message.guild.members.cache.get(botID));
                if (!permission.has("SEND_MESSAGES"))
                    return message.author.send("I don't have the right permissions to send messages and embed links in that channel!");
                if (!permission.has("EMBED_LINKS"))
                    await message.channel.send("I don't have the right permissions to embed links in this channel, **some commands may not work!**");
            }

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

    commandMap.set(Commands.commands[0], MISCELLANEOUS.populate)
    commandMap.set(Commands.commands[1], GAMES.search)
    commandMap.set(Commands.commands[2], GAMES.updateGames)
    commandMap.set(Commands.commands[3], GAMES.personalGames)
    commandMap.set(Commands.commands[4], GAMES.removeGame)
    commandMap.set(Commands.commands[5], GAMES.excludePing)
    commandMap.set(Commands.commands[6], GAMES.excludeDM)
    commandMap.set(Commands.commands[7], generalHelp)
    commandMap.set(Commands.commands[8], gameHelp)
    commandMap.set(Commands.commands[9], helpStats)
    commandMap.set(Commands.commands[10], helpMiscellaneous)
    commandMap.set(Commands.commands[11], helpMusic)
    commandMap.set(Commands.commands[12], MISCELLANEOUS.study)
    commandMap.set(Commands.commands[13], GAMES.pingUsers)
    commandMap.set(Commands.commands[14], initialiseUsers)
    commandMap.set(Commands.commands[15], Delete)
    commandMap.set(Commands.commands[16], STATS.personalStats)
    commandMap.set(Commands.commands[17], STATS.guildStats)
    commandMap.set(Commands.commands[18], STATS.specificStats)
    commandMap.set(Commands.commands[19], STATS.topStats)
    commandMap.set(Commands.commands[20], MUSIC.play)
    commandMap.set(Commands.commands[21], MUSIC.stop)
    commandMap.set(Commands.commands[22], MUSIC.pause)
    commandMap.set(Commands.commands[23], MUSIC.resume)
    commandMap.set(Commands.commands[24], MUSIC.skip)
    commandMap.set(Commands.commands[25], gameTutorial)
    commandMap.set(Commands.commands[26], suggest)
    commandMap.set(Commands.commands[27], setNotifyUpdate)
    commandMap.set(Commands.commands[28], setNotifyTutorials)
    commandMap.set(Commands.commands[29], quitTutorial)
    commandMap.set(Commands.commands[30], GAMES.purgeGamesList)
    commandMap.set(Commands.commands[31], GAMES.gameStats)
    commandMap.set(Commands.commands[32], GAMES.topGames)
    commandMap.set(Commands.commands[33], setServerPrefix)
    commandMap.set(Commands.commands[34], setDefaultPrefix)
    commandMap.set(Commands.commands[35], setDefaultServerPrefix)
    commandMap.set(Commands.commands[36], MUSIC.forward)
    commandMap.set(Commands.commands[37], MUSIC.rewind)
    commandMap.set(Commands.commands[38], MUSIC.seek)
    commandMap.set(Commands.commands[39], MUSIC.reverse)
    commandMap.set(Commands.commands[40], MUSIC.addSong)
    commandMap.set(Commands.commands[41], MUSIC.createPlaylist)
    commandMap.set(Commands.commands[42], MUSIC.myPlayLists)
    commandMap.set(Commands.commands[43], MUSIC.removeSong)
    commandMap.set(Commands.commands[44], MUSIC.playlist)
    commandMap.set(Commands.commands[45], MUSIC.savePlayList)
    commandMap.set(Commands.commands[46], MUSIC.removePlayList)
    commandMap.set(Commands.commands[47], GAMES.Queue)
    commandMap.set(Commands.commands[48], GAMES.deQueue)
    commandMap.set(Commands.commands[49], GAMES.viewActiveSummons)
    commandMap.set(Commands.commands[50], GAMES.banish)
    commandMap.set(Commands.commands[51], GAMES.signUpAllUsers)
    commandMap.set(Commands.commands[52], GAMES.removeGameFromAllUsers)
    commandMap.set(Commands.commands[53], GAMES.signUpSpecificUser)
    commandMap.set(Commands.commands[54], GAMES.removeGameFromSpecificUser)
    commandMap.set(Commands.commands[55], MUSIC.currentSong)
    commandMap.set(Commands.commands[56], MUSIC.currentPlaylist)
    commandMap.set(Commands.commands[57], MISCELLANEOUS.searchForUser)
    commandMap.set(Commands.commands[58], MISCELLANEOUS.flipCoin)
    commandMap.set(Commands.commands[59], MUSIC.goTo)
    commandMap.set(Commands.commands[60], MUSIC.shuffle)
    commandMap.set(Commands.commands[61], MUSIC.repeat)
    commandMap.set(Commands.commands[62], MISCELLANEOUS.decider)
    commandMap.set(Commands.commands[63], MISCELLANEOUS.roll)
    commandMap.set(Commands.commands[64], setTimer)
    commandMap.set(Commands.commands[65], MISCELLANEOUS.shakeUser)
}

async function setTimer(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to provide a time for the timer!");

    if (!/^[:0-9]+$/.test(args)) return message.channel.send("You have entered an invalid time format!");

    if (args.includes(':'))
        args = hmsToSecondsOnly(args);

    let author = message.author;

    if (timers.get(user.id))
        message = await message.channel.send(`Overwriting your previous timer (${timeConvert(timers.get(user.id).time)} remaining) to: ${timeConvert(args)}`);
    else
        message = await message.channel.send(`Set a timer to go off in ${timeConvert(args)}`)

    return timers.set(user.id, { time: args, author: author, message: message });
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
    else
        return 1;
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

async function gameSuggestion(member) {//


}

function findFurthestDate(date1, date2) {

    let numberDate1 = Number(date1.substring(6)) * 365 + Number(date1.substring(3, 5)) * 30 + Number(date1.substring(0, 2));
    let numberDate2 = Number(date2.substring(6)) * 365 + Number(date2.substring(3, 5)) * 30 + Number(date2.substring(0, 2));

    if (numberDate1 < numberDate2)
        return date1;
    return date2;
}
exports.findFurthestDate = findFurthestDate;

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

            let counter = 0;
            for (let i = 0; i < Commands.commands.length; i++) {

                if (Commands.subsection[i].includes(tag)) {
                    counter++;
                    newEmbed.fields[tag - 1].value += counter + ") " + Commands.commands[i] + "\n"
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
            if (err) {
                Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err.toString());
                console.log(err);
            }
            if (res) Client.guilds.cache.get(guildID).channels.cache.get(logID).send(res.toString())
        });
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
exports.getDate = getDate;

function mention(id) {
    return "<@" + id + ">"
}
exports.mention = mention;

function directMessage(message, memberID, game) {

    message.guild.members.cache.get(memberID).user.send(message.member.displayName + " has summoned you for " + game + " in "
        + message.guild.name + "!");
}
exports.directMessage = directMessage;


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
    console.log("Inside of addGUild")
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
exports.hmsToSecondsOnly = hmsToSecondsOnly;

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
    if ((minutes == '00') && (hours == '00')) finalTime = `00:${finalTime}`;
    return finalTime;
}
exports.timeConvert = timeConvert;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
exports.shuffleArray = shuffleArray;

async function generalMatcher(message, params, user, searchArray, internalArray, originalCommand, flavourText) {

    console.log("message.content: ", message.content,
        "ORGINI COMMAND:  ", originalCommand,
        "FLAVY:  ", flavourText);

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
exports.generalMatcher = generalMatcher;
//do this check for all the other files afterwards

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
    //createBackUp();
}
async function createBackUp() {

    let users = await getUsers();

    await fs.writeFile(__dirname + "/backups/" + getDate() + ".json", JSON.stringify(users), function (err, result) {
        if (err) console.log('error', err);
    });

    console.log("CALLED BACKUP");
}//

async function minuteCount() {
    countTalk();
}

async function timerTrack() {
    for (timer of timers.entries()) {

        timer[1].time -= 2;
        timer[1].message.edit(`Set a timer to go off in ${timeConvert(timer[1].time)}`);
        if (timer[1].time <= 0) {
            timer[1].author.send("Your timer has finished!");
            timers.delete(timer[0]);
            timer[1].message.edit(":alarm_clock: *Ring* **Ring** *Ring* :alarm_clock:");
        }
    }
}

setInterval(minuteCount, 60 * 1000);
setInterval(timerTrack, 2000);


//shake user # of times -> have to check for move user perms
//volume control
//sptofiy playlist
//twitch
//make remove game array - it is but broken - ez fix, mark all the spots with -1, then splice out all of them
//make custom 'command prefixes' possible
//moment.js for converting time zones???
//video game stats


//play https://www.youtube.com/watch?v=cKzFsVfRn-A when sean joins, then kick everyone.




//https://dev.twitch.tv/docs/api/reference/#get-streams






//seal idan easter eggs
process.on('unhandledRejection', (reason, promise) => {
    console.log("FFFFFF   ", reason);
    if (prefix != "##") Client.guilds.cache.get(guildID).channels.cache.get(logID).send(("`" + reason.message + "`", "```" + reason.stack + "```", "`MESSAGE: " + lastMessage + "`"));
});

process.on('unhandledException', (reason, p) => {
    console.log(";;;;;;;;;;; ", reason);
    if (prefix != "##") Client.guilds.cache.get(guildID).channels.cache.get(logID).send(("`" + reason.message + "`", "```" + reason.stack + "```", "`MESSAGE: " + lastMessage + "`"));
});

//DM quality of life (for now its just prefixes?) - prefix tutorial
//Stats Tutorial
//for the game tutorial add a continuation showing the remaining extra commands, they can either cover them or skip them - make it Y/N
//if they dont, they can always start it by saying prefixADVANCEDGAMETUTORIAL - which is a seperate tutorial all together. If they want to do it to type that command

//Then make a tutorial for the above commands...


//youtube live streams are broken 

//poker, texas hold em, war, gold fish, 

//Make a vote system for the next feature to focus on
//MEE6 bot - beatiful ui, mainly the website