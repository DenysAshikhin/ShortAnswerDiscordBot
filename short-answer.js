var PORT;
var IP;

var defaultPrefix = "sa!";
global.prefix;

var uri = "";
var token = "";
var lastMessage;

var spotifyClient;
var spotifySecret;
var config = null;
try {

    config = require('./config.json');
    // if (defaultPrefix != '##')
    //     twitchInitiliasation();


    spotifyClient = config.spotifyClient;
    exports.spotifyClient = spotifyClient;
    spotifySecret = config.spotifySecret;
    exports.spotifySecret = spotifySecret

    if (process.argv.length == 3) {

        uri = config.uri;
        token = config.token;
        IP = config.IP;
        PORT = config.PORT;
    }
    else {
        uri = config.uri;
        token = config.TesterToken;
        IP = '127.0.0.1';
        PORT = config.PORT;
        defaultPrefix = "##";
    }
}
catch (err) {
    console.log("config.json doesn't exist - probably running on heroku?");

    uri = process.env.uri;
    token = process.env.token;
    spotifyClient = process.env.spotifyClient;
    exports.spotifyClient = spotifyClient;
    spotifySecret = process.env.spotifySecret;
    exports.spotifySecret = spotifySecret
}

exports.IP = IP;
exports.PORT = PORT;

const Discord = require('discord.js');
const User = require('./User.js');
const Guild = require('./Guild.js')
const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const Commands = require('./commands.json');
exports.Commands = Commands;
const DATABASE = require('./backups/26-04-2020.json');
const fs = require('fs');
const STATS = require('./stats.js');
const MISCELLANEOUS = require('./miscellaneous.js')
const GAMES = require('./games.js');
const MUSIC = require('./music.js');
const ADMINISTRATOR = require('./administrator.js');
const QOF = require('./QOF.js');
const HELP = require('./help.js');
const GENERAL = require('./general.js');
const TUTORIAL = require('./tutorial.js');
const BUGS = require('./bugs.js');
const ffmpeg = require('fluent-ffmpeg');

const Cache = require('caching-map');


const cachedUsers = new Cache(100);
const cachedGuilds = new Cache(100);

ffmpeg.setFfmpegPath(ffmpegPath);
var needle = require('needle');
exports.needle = needle;

const crypto = require('crypto');
const algorithm = 'aes-256-gcm',
    password = crypto.createHash('sha256').update(String(config.KEY)).digest('base64').substr(0, 32);

var osu = require('node-os-utils');
const { executionAsyncResource } = require('async_hooks');
var cpu = osu.cpu;
var mem = osu.mem;

async function OSU() {
    console.log(await mem.info());
    console.log(await cpu.usage());
}
//setInterval(OSU, 10000);

var checkCommandsSearchArray = Commands.reduce((accum, curr) => {
    accum.upperCase.push(curr.title.toUpperCase());
    accum.normal.push(curr.title);
    return accum;
}, { upperCase: [], normal: [] });
exports.commandsText = checkCommandsSearchArray;

var EMOJI = new Map();
//EMOJI.set('bronze1', '725771774532517948');

const logID = '712000077295517796';
exports.logID = logID;
const creatorID = '99615909085220864';
exports.creatorID = creatorID;
const botID = '689315272531902606';
exports.botID = botID;
const guildID = '97354142502092800';
exports.guildID = guildID;

const options = {
    isCaseSensitive: false,
    findAllMatches: true,
    includeMatches: false,
    includeScore: true,
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
    11// - twitch
]
exports.tags = tags;

var Client = new Discord.Client();

var commandMap = new Map();
var commandTracker = new Map();


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

const getGuilds = async function () {
    try {
        return await Guild.find({})
    } catch (err) {
        console.log(err);
        Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err);
    }
}
exports.getGuilds = getGuilds;

const getUsersInGuild = async function (guildID) {
    try {
        return await User.find({ guilds: guildID });
    }
    catch (err) {
        console.log(err);
        Client.guilds.cache.get(guildID).channels.cache.get(logID).send(err);
    }
}
exports.getUsersInGuild = getUsersInGuild;


const encrypt = function (text) {
    const iv = crypto.randomBytes(12);
    var cipher = crypto.createCipheriv(algorithm, password, iv)
    var encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex');
    var tag = cipher.getAuthTag();
    return {
        content: encrypted,
        tag: tag,
        iv: iv
    };
}
exports.encrypt = encrypt;

const decrypt = function (encrypted) {
    var decipher = crypto.createDecipheriv(algorithm, password, encrypted.iv)
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}
exports.decrypt = decrypt;

const sendToServer = async function (data) {

    let encrypted = encrypt(JSON.stringify({ ...data, password: config.PASSWORD }))

    let resp = await needle('get', `${IP}:${PORT}`, null,
        { headers: { 'payload': encrypted.content, 'tag': encrypted.tag.toString('base64'), 'iv': encrypted.iv.toString('base64') } });

    let payload = JSON.parse(resp.raw.toString('utf8'));
    let decryptedPayload = decrypt({ content: payload.payload, tag: Buffer.from(payload.tag, 'base64'), iv: Buffer.from(payload.iv, 'base64') })

    let finalPayload = JSON.parse(decryptedPayload);
    if ((typeof finalPayload) == 'string')
        finalPayload = JSON.parse(finalPayload);

    return finalPayload;
}
exports.sendToServer = sendToServer;




connectDB.once('open', async function () {


    await Client.login(token);
    updateAll();
    populateCommandMap();
    TUTORIAL.initialTutorialPopulate();

    Client.on("ready", () => {

        console.log("Ready!");
        exports.Client = Client;

        Client.user.setActivity("sa!help for information");
    });

    Client.on("message", async (message) => {

        if (message.author.bot) return;

        let user = cachedUsers.get(message.author.id);
        if (!user) {

            user = await findUser({ id: message.author.id });
            cachedUsers.set(user.id, user);
        }


        if (message.channel.type != 'dm') {

            let guild = cachedGuilds.get(message.guild.id);
            if (!guild) {

                guild = await findGuild({ id: message.guild.id });
                cachedUsers.set(user.id, user);
            }


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

            user = await findUser({ id: message.author.id });
            cachedUsers.set(user.id, user);
            console.log(`Number of cached users: ${cachedUsers.size}`);

            if (message.channel.type != 'dm') {
                let permission = message.channel.permissionsFor(message.guild.members.cache.get(botID));
                if (!permission.has("SEND_MESSAGES"))
                    return message.author.send("I don't have the right permissions to send messages and embed links in that channel!");
                if (!permission.has("EMBED_LINKS"))
                    await message.channel.send("I don't have the right permissions to embed links in this channel, **some commands may not work!**");
                if (!permission.has("ADD_REACTIONS"))
                    await message.channel.send("I don't have the right permissions to add reactions, **some commands may not work!**");
                if (!permission.has("USE_EXTERNAL_EMOJIS"))
                    await message.channel.send("I don't have the right permissions to add reactions, **some commands may not work!**");



                //add can't add custom emojis? and react to messages
            }

            let command = message.content.split(' ')[0].substr(prefix.length).toUpperCase();
            exports.prefix = prefix;

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

    Client.on("guildCreate", async guild => {

        let searchedGuild = await findGuild({ id: guild.id });
        if (!searchedGuild) createGuild(guild);
    })

    Client.on("guildDelete", async guild => {

        console.log(`Bot has been kicked from ${guild.name}`);
    })
});

function populateCommandMap() {

    commandMap.set(Commands[0].title.toUpperCase(), MISCELLANEOUS.populate)
    commandMap.set(Commands[1].title.toUpperCase(), GAMES.search)
    commandMap.set(Commands[2].title.toUpperCase(), GAMES.updateGames)
    commandMap.set(Commands[3].title.toUpperCase(), GAMES.personalGames)
    commandMap.set(Commands[4].title.toUpperCase(), GAMES.removeGame)
    commandMap.set(Commands[5].title.toUpperCase(), GAMES.excludePing)
    commandMap.set(Commands[6].title.toUpperCase(), GAMES.excludeDM)
    commandMap.set(Commands[7].title.toUpperCase(), HELP.generalHelp)
    commandMap.set(Commands[8].title.toUpperCase(), HELP.gameHelp)
    commandMap.set(Commands[9].title.toUpperCase(), HELP.helpStats)
    commandMap.set(Commands[10].title.toUpperCase(), HELP.helpMiscellaneous)
    commandMap.set(Commands[11].title.toUpperCase(), HELP.helpMusic)
    commandMap.set(Commands[12].title.toUpperCase(), MISCELLANEOUS.study)
    commandMap.set(Commands[13].title.toUpperCase(), GAMES.pingUsers)
    commandMap.set(Commands[14].title.toUpperCase(), ADMINISTRATOR.initialiseUsers)
    commandMap.set(Commands[15].title.toUpperCase(), GENERAL.Delete)
    commandMap.set(Commands[16].title.toUpperCase(), STATS.personalStats)
    commandMap.set(Commands[17].title.toUpperCase(), STATS.guildStats)
    commandMap.set(Commands[18].title.toUpperCase(), STATS.specificStats)
    commandMap.set(Commands[19].title.toUpperCase(), STATS.topStats)
    commandMap.set(Commands[20].title.toUpperCase(), MUSIC.play)
    commandMap.set(Commands[21].title.toUpperCase(), MUSIC.stop)
    commandMap.set(Commands[22].title.toUpperCase(), MUSIC.pause)
    commandMap.set(Commands[23].title.toUpperCase(), MUSIC.resume)
    commandMap.set(Commands[24].title.toUpperCase(), MUSIC.skip)
    commandMap.set(Commands[25].title.toUpperCase(), TUTORIAL.gameTutorial)
    commandMap.set(Commands[26].title.toUpperCase(), BUGS.suggest)
    commandMap.set(Commands[27].title.toUpperCase(), QOF.setNotifyUpdate)
    commandMap.set(Commands[28].title.toUpperCase(), TUTORIAL.setNotifyTutorials)
    commandMap.set(Commands[29].title.toUpperCase(), TUTORIAL.quitTutorial)
    commandMap.set(Commands[30].title.toUpperCase(), GAMES.purgeGamesList)
    commandMap.set(Commands[31].title.toUpperCase(), GAMES.gameStats)
    commandMap.set(Commands[32].title.toUpperCase(), GAMES.topGames)
    commandMap.set(Commands[33].title.toUpperCase(), QOF.setServerPrefix)
    commandMap.set(Commands[34].title.toUpperCase(), QOF.setDefaultPrefix)
    commandMap.set(Commands[35].title.toUpperCase(), ADMINISTRATOR.setDefaultServerPrefix)
    commandMap.set(Commands[36].title.toUpperCase(), MUSIC.forward)
    commandMap.set(Commands[37].title.toUpperCase(), MUSIC.rewind)
    commandMap.set(Commands[38].title.toUpperCase(), MUSIC.seek)
    commandMap.set(Commands[39].title.toUpperCase(), MUSIC.reverse)
    commandMap.set(Commands[40].title.toUpperCase(), MUSIC.addSong)
    commandMap.set(Commands[41].title.toUpperCase(), MUSIC.createPlaylist)
    commandMap.set(Commands[42].title.toUpperCase(), MUSIC.myPlayLists)
    commandMap.set(Commands[43].title.toUpperCase(), MUSIC.removeSong)
    commandMap.set(Commands[44].title.toUpperCase(), MUSIC.playUserPlayList)
    commandMap.set(Commands[45].title.toUpperCase(), MUSIC.savePlayList)
    commandMap.set(Commands[46].title.toUpperCase(), MUSIC.removePlayList)
    commandMap.set(Commands[47].title.toUpperCase(), GAMES.Queue)
    commandMap.set(Commands[48].title.toUpperCase(), GAMES.deQueue)
    commandMap.set(Commands[49].title.toUpperCase(), GAMES.viewActiveSummons)
    commandMap.set(Commands[50].title.toUpperCase(), GAMES.banish)
    commandMap.set(Commands[51].title.toUpperCase(), GAMES.signUpAllUsers)
    commandMap.set(Commands[52].title.toUpperCase(), GAMES.removeGameFromAllUsers)
    commandMap.set(Commands[53].title.toUpperCase(), GAMES.signUpSpecificUser)
    commandMap.set(Commands[54].title.toUpperCase(), GAMES.removeGameFromSpecificUser)
    commandMap.set(Commands[55].title.toUpperCase(), MUSIC.currentSong)
    commandMap.set(Commands[56].title.toUpperCase(), MUSIC.currentPlaylist)
    commandMap.set(Commands[57].title.toUpperCase(), MISCELLANEOUS.searchForUser)
    commandMap.set(Commands[58].title.toUpperCase(), MISCELLANEOUS.flipCoin)
    commandMap.set(Commands[59].title.toUpperCase(), MUSIC.goTo)
    commandMap.set(Commands[60].title.toUpperCase(), MUSIC.shuffle)
    commandMap.set(Commands[61].title.toUpperCase(), MUSIC.repeat)
    commandMap.set(Commands[62].title.toUpperCase(), MISCELLANEOUS.decider)
    commandMap.set(Commands[63].title.toUpperCase(), MISCELLANEOUS.roll)
    commandMap.set(Commands[64].title.toUpperCase(), QOF.setTimer)
    commandMap.set(Commands[65].title.toUpperCase(), MISCELLANEOUS.shakeUser)
    commandMap.set(Commands[66].title.toUpperCase(), MUSIC.volume)
    commandMap.set(Commands[67].title.toUpperCase(), QOF.setCommand)
    commandMap.set(Commands[68].title.toUpperCase(), QOF.commandMonikers)
    commandMap.set(Commands[69].title.toUpperCase(), QOF.removeMoniker)
    commandMap.set(Commands[70].title.toUpperCase(), GENERAL.timeZone)
    commandMap.set(Commands[71].title.toUpperCase(), MISCELLANEOUS.linkTwitch)
    commandMap.set(Commands[72].title.toUpperCase(), MISCELLANEOUS.unlinkTwitch)
    commandMap.set(Commands[73].title.toUpperCase(), MISCELLANEOUS.viewTwitchFollows)
    commandMap.set(Commands[74].title.toUpperCase(), MISCELLANEOUS.unfollowTwitchChannel)
    commandMap.set(Commands[75].title.toUpperCase(), MISCELLANEOUS.followTwitchChannel)
    commandMap.set(Commands[76].title.toUpperCase(), MISCELLANEOUS.linkChannelWithTwitch)
    commandMap.set(Commands[77].title.toUpperCase(), MISCELLANEOUS.showChannelTwitchLinks)
    commandMap.set(Commands[78].title.toUpperCase(), MISCELLANEOUS.removeChannelTwitchLink)
    commandMap.set(Commands[79].title.toUpperCase(), MISCELLANEOUS.leagueStats)
    commandMap.set(Commands[80].title.toUpperCase(), MISCELLANEOUS.RLRanks)
    commandMap.set(Commands[81].title.toUpperCase(), MISCELLANEOUS.RLTracker)
    commandMap.set(Commands[82].title.toUpperCase(), MISCELLANEOUS.UnlinkRLTracker)
    commandMap.set(Commands[83].title.toUpperCase(), MISCELLANEOUS.viewRLTrackers)
    commandMap.set(Commands[84].title.toUpperCase(), HELP.helpAdministrator)
    commandMap.set(Commands[85].title.toUpperCase(), HELP.helpQOF)
    commandMap.set(Commands[86].title.toUpperCase(), HELP.helpTutorials)
    commandMap.set(Commands[87].title.toUpperCase(), HELP.helpBugsSuggestions)
    commandMap.set(Commands[88].title.toUpperCase(), HELP.helpTwitch)
    commandMap.set(Commands[89].title.toUpperCase(), HELP.helpGeneral)
    commandMap.set(Commands[90].title.toUpperCase(), TUTORIAL.introTutorial)

    exports.commandMap = commandMap;
}

async function triggerCommandHandler(message, user, skipSearch, emoji) {

    let tracky = emoji ? commandTracker.get(user.id) : commandTracker.get(message.author.id);

    if (tracky) {

        if (message.content == -1) return commandTracker.delete(message.author.id);

        let result = await handleCommandTracker(tracky, message, user, skipSearch, emoji);
        if (result == 1) {
            commandTracker.delete(user.id);
            return result;
        }
        return result;
    }
}

const getEmoji = function (EMOJI) {
    let emoji = Client.guilds.cache.get(guildID).emojis.cache.find(emo => emo.name == EMOJI);
    if (emoji) {

        return `<:${EMOJI}:${emoji.id}>`;
    }
    return '';
}
exports.getEmoji = getEmoji;

const getEmojiObject = function (EMOJI) {
    let emoji = Client.guilds.cache.get(guildID).emojis.cache.find(emo => emo.name == EMOJI);
    if (emoji) {

        return emoji;
    }
    return '';
}
exports.getEmojiObject = getEmojiObject;

async function commandMatcher(message, command, params, user) {

    let check = await checkCommands(command, user);

    if (check == -1) {
        message.channel.send(`I didn't recognize that command, please try again?`);
        return -1;
    }
    else if (check.result[0].score != 0) {

        let fieldArray = new Array();

        for (let i = 0; i < check.result.length; i++) {
            fieldArray.push({ value: check.result[i], name: "** **", inline: false })
        }

        prettyEmbed(message, check.prettyList, {
            description: `${command} is not a valid command, if you meant one of the following, simply type the **number** you wish to use:`,
            startTally: 1, modifier: 1, selector: true
        });

        // prettyEmbed(message, `${command} is not a valid command, if you meant one of the following, simply type the **number** you wish to use:`,
        //     fieldArray, -1, 1, 1, null, null, true);
        specificCommandCreator(commandMatcher, [message, -1, params, user], check.result, user);
        return -11;
    }
    else {

        let match = user.commands.find(element => element[1] == check.result[0].item);
        match = match ? commandMap.get(match[0]) : commandMap.get(check.result[0].item);

        specificCommandCreator(match, [message, params, user], null, user);
        return await triggerCommandHandler(message, user, true);
    }
}

//-1 invalid input, 0 don't delete (passed to command matcher) - need it next time, 1 handled - delete
async function handleCommandTracker(specificCommand, message, user, skipSearch, emoji) {
    let params = emoji ? emoji + '' : message.content;
    let tutorialResult;

    if (!skipSearch) {
        if (!isNaN(params) && params.length > 0) {

            params = Math.floor(Number(params));
            params--;
            if (params > Math.Max_Safe_INTEGER) return message.channel.send("You have entered an invalid option, please try again!");
            if (params >= specificCommand.choices.length || params < 0) {
                if (emoji)
                    selfDestructMessage(message, "You have entered an invalid number, please try again. Or type *-1* to quit the suggestion.", 3, emoji);
                else
                    message.channel.send("You have entered an invalid number, please try again. Or type *-1* to quit the suggestion.");
                return -1;
            }

            specificCommand.defaults[1] = specificCommand.choices[Math.floor(params)].item
            tutorialResult = await TUTORIAL.tutorialStarter(specificCommand.defaults[0], specificCommand.command, specificCommand.defaults[1], user);
            if (tutorialResult != -22)
                return tutorialResult;
        }
        else {
            message.channel.send("You entered an invalid option, please try again or enter *-1* to quit the suggestion prompt.");
            return 0;
        }
    }
    else {

        tutorialResult = await TUTORIAL.tutorialStarter(specificCommand.defaults[0], specificCommand.defaults[1], specificCommand.command, user);
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
exports.specificCommandCreator = specificCommandCreator;

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
    let prettyArray = [];
    // let finalList = "";
    let newOptions = JSON.parse(JSON.stringify(options));
    newOptions = {
        ...newOptions,
        isCaseSensitive: false,
        minMatchCharLength: params.length / 2,
        findAllMatches: true,
        includeScore: true
    }

    let fuse;

    if (user.commands) {

        let reducedCommands = user.commands.reduce((accum, current) => { accum.push(current[1]); return accum }, []);
        newOptions.keys.push("temp");
        checkCommandsSearchArray.temp = checkCommandsSearchArray.upperCase.concat(reducedCommands);

        fuse = new Fuse(checkCommandsSearchArray.upperCase.concat(reducedCommands), newOptions);
    }
    else
        fuse = new Fuse(checkCommandsSearchArray.upperCase, newOptions);

    let result = fuse.search(params);
    let maxResults = 5;
    if (maxResults > result.length)
        maxResults = result.length;

    for (let i = 0; i < maxResults; i++) {

        if (result[i].refIndex >= checkCommandsSearchArray.normal.length)
            prettyArray.push(checkCommandsSearchArray.temp[result[i].refIndex]);
        else
            prettyArray.push(checkCommandsSearchArray.normal[result[i].refIndex]);
        finalArray.push(result[i]);
    }

    let completeCheck = {
        result: finalArray,
        prettyList: prettyArray
    };

    if (finalArray.length > 0)
        return completeCheck;
    else return -1
}

// //-22 meaning no matching tutorial was found
// async function tutorialHandler(message, command, params, user) {

//     switch (user.activeTutorial) {
//         case 0:
//             if (command == TUTORIAL.GameTutorial.specificCommand[user.tutorialStep] || command == TUTORIAL.gameTutorial) {

//                 return await TUTORIAL.tutorialStarter(message, params, command, user);
//             }
//         case 1:

//             break;
//     }

//     return -22;
// }

// `Greetings!\nYou are getting this message because I noticed you haven't signed up for any games! If you would like to summon other players (friends)`
// + ` to play a game with you, be notified when someone else wants to play a game, manage your games list and more type **${prefix}gameTutorial**`
// + ` for a step-by-step walkthrough! However, if you would like to opt out of this and all future tutorials, type **${prefix}tutorials** *false*.`

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
        defaultPrefix: "-1",
        commands: []
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
exports.checkExistance = checkExistance;

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


async function setControlEmoji(message) {
    setEmojiCollector(message);
    await message.react('1️⃣')
    await message.react('2️⃣')
    await message.react('3️⃣')
    await message.react('4️⃣')
    await message.react('5️⃣')
}

// async function setEmojiCollector() {
//     for (let messy of commandTracker.values()) {
//         messy.collector.resetTimer();
//     }
// }
//setInterval(refreshEmojiControls, 20 * 1000);
async function setEmojiCollector(message) {

    let collector = await message.createReactionCollector(function (reaction, user) {
        return (((reaction.emoji.name === '1️⃣') || (reaction.emoji.name === '2️⃣') ||
            (reaction.emoji.name === '3️⃣') || (reaction.emoji.name === '4️⃣') || (reaction.emoji.name === '5️⃣')
            && (user.id != message.author.id)) && (!user.bot))
    }, { time: 60000 });
    collector.on('collect', async function (emoji, user) {

        //  console.log("INSIDE OF NUMBA- ")
        let choice;
        let usery = await findUser({ id: user.id });
        if (emoji.emoji.toString() == '1️⃣') {
            choice = 1;
        }
        else if (emoji.emoji.toString() == '2️⃣') {
            choice = 2;
        }
        else if (emoji.emoji.toString() == '3️⃣') {
            choice = 3;
        }
        else if (emoji.emoji.toString() == '4️⃣') {
            choice = 4;
        }
        else if (emoji.emoji.toString() == '5️⃣') {
            choice = 5;
        }
        let finy = await triggerCommandHandler(emoji.message, usery, false, choice);

        if (finy == 1) {
            emoji.message.reactions.removeAll();
            emoji.message.delete();
        }
        else {
            emoji.users.remove(user);
        }
        //}
    });
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
        // console.log(result)
        if (result[0])
            if (result[0].score == 0) {
                // console.log("ORIGIN:::", originalCommand);
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
            fieldArray.push(promptArray[i].item);

        prettyEmbed(message, fieldArray, { description: flavourText, startTally: 1, modifier: 1, selector: true });
        //prettyEmbed(message, flavourText, fieldArray, -1, 1, 1, null, null, true);

        specificCommandCreator(originalCommand, [message, -1, user], parameterArray, user);
        return 0;
    }
    else {
        message.channel.send(`You have entered an invalid suggestion number/input please try again.`);
        return -1
    }
}
exports.generalMatcher = generalMatcher;

/**
 * 
 * @param {part, startTally, modifier, URL, title, description, selector, maxLength} extraParams 
 */
async function prettyEmbed(message, array, extraParams) {


    let part = extraParams.part ? extraParams.part : -1;
    let tally = extraParams.startTally ? extraParams.startTally : -1;
    let modifier = extraParams.modifier ? extraParams.modifier : -1;
    let URL = extraParams.URL;
    let title = extraParams.title;
    let selector = extraParams.selector;
    let description = extraParams.description ? extraParams.description : '';
    let maxLength = extraParams.maxLength ? extraParams.maxLength : 100;

    let runningString = "";
    let previousName = "";
    let groupNumber = 1;
    let field = null;
    let fieldArray = [];


    let tester = 1;


    for (item of array) {
        let BIGSPLIT = false;
        if (item.value == '') continue;
        element = item.value ? item.value : item;
        element = element ? element : '** **';
        if (element == '** **') continue;

        element = Array.isArray(element) ? element.join("\n") : element;
        let itemName = item.name ? item.name : "";

        if ((previousName != itemName) && (field != null)) {
            if (item.name) {
                previousName = '';
            }

            if (field.name != '')
                field.name = field.name;
            else if (part == -1)
                field.name = '** **';
            else
                field.name = `${part} ${groupNumber}`;

            if (field.value.length != 0) {

                fieldArray.push(JSON.parse(JSON.stringify(field)));
            }

            runningString = "";
            groupNumber++;
            field = { name: "", value: [], inline: true };
        }

        if ((runningString.length < maxLength) || (field == null)) {

            if (((runningString.length + element.length) >= maxLength)) {

                let tempItem = JSON.parse(JSON.stringify(item));

                tempElement = tempItem.value ? tempItem.value : tempItem;
                tempElement = tempElement ? tempElement : '** **';
                tempElement = Array.isArray(tempElement) ? tempElement.join("\n") : tempElement;

                if (runningString.length == 0) {
                    if (tempElement.includes('\n')) {
                        let tempRun = '';
                        for (newSplit of tempElement.split('\n')) {
                            if (newSplit.length > maxLength) {
                                await message.channel.send(`${newSplit} is too long to be included in the embeds. If this occured from normal use, please notify the creator with the **suggest** command!`);
                            }
                            else
                                tempRun += newSplit + "\n";
                            if (tempRun.length > maxLength) break;
                        }

                        tempElement = tempElement.substring(tempRun.length);
                        element = element.substring(0, tempRun.length);
                    }
                    else {
                        console.log("UNSPLITABLE AF")
                        return message.channel.send("Found an unsplittable message body, odds of that happening naturally are next-to-none so stop testing me D:< However, if this is indeed from normal use, please notify the creator with the **suggest** command.");
                    }
                }
                else {
                    tempElement = -1;
                }

                if (tempElement != -1) {
                    if (tempItem.value)
                        tempItem.value = tempElement;
                    else
                        tempItem = tempElement;

                    array.splice(array.indexOf(item) + 1, 0, tempItem)
                }
                BIGSPLIT = true;
            }
            {
                runningString += element;

                field = field == null ? { name: "", value: [], inline: true } : field;
                if (itemName != '') {
                    field.name = itemName;
                    previousName = itemName;
                }
                else if (part == -1) {
                    field.name = '** **';
                    previousName = '';
                }
                else {
                    field.name = `${part} ${groupNumber}`;
                    previousName = `${part} ${groupNumber}`;
                }
                if (!extraParams.startTally)
                    field.value.push(`${element}`);
                else
                    field.value.push(`${tally}) ${element}`);
            }

            if (BIGSPLIT) {
                if (item.name) {
                    field.name = item.name;
                    previousName = item.name;
                }

                fieldArray.push(JSON.parse(JSON.stringify(field)));

                runningString = "";
                groupNumber++;
                field = { name: "", value: [], inline: true };
            }
        }
        tally++;
    }

    if (field.name != '')
        field.name = field.name;
    else if (part == -1) {
        field.name = '** **';
    }
    else
        field.name = `${part} ${groupNumber}`;
    if (field.value.length != 0)
        fieldArray.push(JSON.parse(JSON.stringify(field)));

    return await testy(fieldArray, description, message, modifier, URL, title, selector);
}
exports.prettyEmbed = prettyEmbed;

function createThreeQueue(array) {

    let threeQueue = {
        queue: [[], [], []],
        index: 0
    };

    let rows = Math.floor(array.length / 3);
    if ((array.length % 3) > 0) rows++;

    if (rows < 4) {
        for (let j = 0; j < rows; j++) {

            if (array.length == 4) {

                threeQueue.queue[0] = [array[0], array[1]];
                threeQueue.queue[1] = [array[2], array[3]];
                break;
            }
            else {
                threeQueue.queue[0].push(array[j]);

                if (!array[j + (rows)])
                    threeQueue.queue[1].push({ name: "** **", value: "** **", inline: true });
                else
                    threeQueue.queue[1].push(array[j + (rows)]);

                if (!array[j + (2 * rows)])
                    threeQueue.queue[2].push({ name: "** **", value: "** **", inline: true });
                else
                    threeQueue.queue[2].push(array[j + (2 * rows)]);
            }
        }
    }
    else {
        for (let x = 0; x < array.length; x += 3) {

            threeQueue.queue[0].push(array[x]);

            if (!array[x + 1])
                threeQueue.queue[1].push({ name: "** **", value: "** **", inline: true });
            else
                threeQueue.queue[1].push(array[x + 1]);

            if (!array[x + 2])
                threeQueue.queue[2].push({ name: "** **", value: "** **", inline: true });
            else
                threeQueue.queue[2].push(array[x + 2]);
        }
    }
    return threeQueue;
}

async function testy(ARR, description, message, modifier, URL, title, selector) {

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.description = description;
    newEmbed.title = title ? title : newEmbed.title;
    newEmbed.thumbnail.url = URL;

    let amount = ARR.length > 24 ? 24 : ARR.length;

    let threeQueue = createThreeQueue(ARR.splice(0, amount))

    threeQueue.index = 0;

    for (let i = 0; i < 25; i++) {

        let field = threeQueue.queue[threeQueue.index].shift();
        if (!field) {
            if (threeQueue.index == 0) {
                break;
            }
            else {
                newEmbed.fields.push({ name: "** **", value: "** **", inline: true })
                threeQueue.index = threeQueue.index == 2 ? 0 : threeQueue.index + 1;
                continue;
            }
        }

        if (!Array.isArray(field.value)) {
        }
        else if (modifier == -1) {
            field.value = field.value.join('\n');
        }
        else if (modifier == 1) {
            field.value = "```" + "\n" + field.value.join('\n') + "```";
        }
        else if (modifier) {
            field.value = "```" + modifier + "\n" + field.value.join('\n') + "```";
        }
        newEmbed.fields.push(field);
        threeQueue.index = threeQueue.index == 2 ? 0 : threeQueue.index + 1;
    }


    if (ARR.length > 0) {
        message.channel.send({ embed: newEmbed });
        return testy(ARR, description, message, modifier);
    }

    if (!selector) {
        return await message.channel.send({ embed: newEmbed });
    }
    else {
        let temp = await message.channel.send({ embed: newEmbed });
        setControlEmoji(temp);
        return 20;
    }
}

function sendHelpMessage(Index, message) {

    let examples = "```md\n";

    examples += Commands[Index].explanation + "\n\n";

    for (example of Commands[Index].example) {

        //  console.log(examples)
        let index = example.indexOf(" ");
        examples += `<${example.slice(0, index)}` + prefix + `${example.slice(index + 1)}>\n\n`;
    }
    examples += "```";
    return message.channel.send(examples);
}
exports.sendHelpMessage = sendHelpMessage;

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

    // for (let user of users) {

    //     User.findOneAndUpdate({ id: user.id }, { $set: { commands: [] } }, () => { });

    // }//for user loop


    // console.log("CALLED UPDATE ALL");
    // createBackUp();
}
async function createBackUp() {

    let users = await getUsers();

    await fs.writeFile(__dirname + "/backups/" + getDate() + ".json", JSON.stringify(users), function (err, result) {
        if (err) console.log('error', err);
    });

    console.log("CALLED BACKUP");
}//


async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;

/**
 * 

 * @param {*} emoji -> If exists, don't delete the message
 */
async function selfDestructMessage(message, text, seconds, emoji) {

    let temp = await message.channel.send(text);
    await sleep(seconds * 1000);
    temp.delete();
    if (!emoji) message.delete();
}
exports.selfDestructMessage = selfDestructMessage;



//release 1
//make sockets auto kill themselves once the server responds with ok. ({kill: true}) and replace this for functions that have back and forth for no reason. Even sending messages -> scraper can do
//format timezone better
//video game stats



//seal idan easter eggs
process.on('unhandledRejection', (reason, promise) => {
    console.log("FFFFFF   ", reason);
    Client.guilds.cache.get(guildID).channels.cache.get(logID).send(("`" + reason.message + "`", "```" + reason.stack + "```", "`MESSAGE: " + lastMessage + "`"));
});

process.on('unhandledException', (reason, p) => {
    console.log(";;;;;;;;;;; ", reason);
    Client.guilds.cache.get(guildID).channels.cache.get(logID).send(("`" + reason.message + "`", "```" + reason.stack + "```", "`MESSAGE: " + lastMessage + "`"));
});




//release 2
//give people ability to choose how their menus are skinned!
//DM quality of life (for now its just prefixes?) - prefix tutorial
//Stats Tutorial
//for the game tutorial add a continuation showing the remaining extra commands, they can either cover them or skip them - make it Y/N
//if they dont, they can always start it by saying prefixADVANCEDGAMETUTORIAL - which is a seperate tutorial all together. If they want to do it to type that command

//Then make a tutorial for the above commands...


//release 3
//play https://www.youtube.com/watch?v=cKzFsVfRn-A when sean joins, then kick everyone.
//poker, texas hold em, war, gold fish, 

//Make a vote system for the next feature to focus on

//Make a missingGame command, that makes takes a game name, returns the top 10 result, if the person doesn't see it, they can press confirm
//this will add it to a queue, where only one game a time is shown in the support server channel. It will display the suggestion, closest matches (5?)
//the name of person as well as which server. There will be a checkmark and x emoji. Clicking on check will add the game to the gameslist, x will remove
//the thing from suggestion and add it to a rejectGame array + json. It will also send a person a notification if there suggestion has been approved
//or refused
//Maybe an emoji for accepted, thanks for the suggestion! Or rejected because: dumb/troll suggestion, already exists (someone else suggested before you)
//if accepted, also say that it should be live within a few hours


//MEE6 bot - beatiful ui, mainly the website