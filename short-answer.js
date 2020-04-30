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
    ],
    steps: []
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



const maintenance = false;

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

            if (maintenance) message.channel.send("Just a heads up that I'm being developed in real time and certain actions may be bugged!");
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

        let fieldArray = new Array();

        for (let i = 0; i < check.result.length; i++) {

            //fieldArray.push({ name: check.result[i].item, value: i, inline: false })
            fieldArray.push({ name: `${i} - ` + check.result[i].item, value: "** **", inline: false })
        }

        const newEmbed = {
            ...Embed,
            date: new Date,
            description: `${command} is not a valid command, if you meant one of the following, simply type the **number** you wish to use:`,
            fields: fieldArray
        }

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

    let params = message.content;
    let tutorialResult;
    if (!skipSearch) {
        if (!isNaN(params) && params.length > 0) {
            params = Math.floor(params);
            if (params >= specificCommand.choices.length || params < 0)
                return -1;

            specificCommand.defaults[1] = specificCommand.choices[Math.floor(params)].item

            tutorialResult = await tutorialHandler(specificCommand.defaults[0], specificCommand.command, specificCommand.defaults[1], user);
            if (tutorialResult != -22)
                return tutorialResult;
        }
    }
    else {

        tutorialResult = await tutorialHandler(specificCommand.defaults[0], specificCommand.command, specificCommand.defaults[1], user);
        if (tutorialResult != -22)
            return tutorialResult;
    }

    let finishy = await specificCommand.command.apply(null, specificCommand.defaults);

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

    let newEmbed = {
        ...Embed,
        title: Embed.title + " Game Tutorial",
        date: new Date,
        description: prompt,
        fields: fieldArray
    }

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
            let gameEmbed = {
                ...Embed,
                date: new Date(),
                description: display + " here are the games you are signed up for:",
                fields: fieldArray
            }
            await message.channel.send({ embed: gameEmbed });
            fieldArray = new Array();
            left = false;
        }
    }

    if (games.length > 0) {
        if (left) {
            let gameEmbed = {
                ...Embed,
                date: new Date(),
                description: display + " here are the games you are signed up for:",
                fields: fieldArray
            }
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


    let statsEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` - Top Stats for ${message.guild.name}!`,
        thumbnail: { url: message.guild.iconURL() },
        fields: [
            { name: `The Silent Type: ${silentType.displayName}`, value: `${silentType.messages[silentTypeIndex]} messages sent.` },
            { name: `The Loud Mouth: ${loudMouth.displayName}`, value: `${loudMouth.timeTalked[loudMouthIndex]} minutes spent talking.` },
            { name: `The Ghost: ${ghost.displayName}`, value: `${ghost.timeAFK[ghostIndex]} minutes spent AFK.` },
            { name: `The MIA: ${MIA.displayName}`, value: findFurthestDate(MIA.lastTalked[MIAIndex], MIA.lastMessage[MIAIndex]) + " last seen date." },
            { name: `The Summoner: ${summoner.displayName}`, value: `${summoner.summoner[summonerIndex]} summoning rituals completed.` }
        ]
    }

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

        statsEmbed = {
            ...Embed,
            date: new Date(),
            title: Embed.title,
            fields: [
                { name: "Total number of messages sent: ", value: user.messages[index], inline: false },
                { name: "Last message sent: ", value: user.lastMessage[index], inline: false },
                { name: "Total time spent talking (in minutes): ", value: user.timeTalked[index], inline: false },
                { name: "Last time you talked was: ", value: user.lastTalked[index], inline: false },
                { name: "The games you are signed up for: ", value: user.games, inline: false },
                { name: "Time spent AFK (in minutes): ", value: user.timeAFK[index], inline: false },
                { name: "You joined this server on: ", value: user.dateJoined[index], inline: false },
                { name: "Whether you are excluded from pings: ", value: user.excludePing, inline: false },
                { name: "Whether you are excluded from DMs: ", value: user.excludeDM, inline: false },
                { name: "Number of succesful summons: ", value: user.summoner[index], inline: false },
            ]
        }
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

        message.channel.send({
            embed: {
                ...Embed,
                date: new Date(),
                title: Embed.title,
                description: ` ${message.author.username} Here Are Your General Stats!`,
                thumbnail: { url: message.author.avatarURL() },
                fields: [
                    { name: "The games you are signed up for: ", value: user.games },
                    { name: "Whether you are excluded from pings: ", value: user.excludePing },
                    { name: "Whether you are excluded from DMs: ", value: user.excludeDM }
                ]
            }
        });

        for (let i = 0; i < user.guilds.length; i++) {

            if (!user.kicked[i]) {
                let stats = "";

                statsEmbed = {
                    ...Embed,
                    date: new Date(),
                    title: Embed.title,
                    description: `Here Are Your Stats For ${message.client.guilds.cache.get(user.guilds[i]).name} Server!`,
                    thumbnail: { url: message.client.guilds.cache.get(user.guilds[i]).iconURL() },
                    fields: [
                        { name: "Total number of messages sent: ", value: user.messages[i], inline: false },
                        { name: "Last message sent: ", value: user.lastMessage[i], inline: false },
                        { name: "Total time spent talking (in minutes): ", value: user.timeTalked[i], inline: false },
                        { name: "Last time you talked was: ", value: user.lastTalked[i], inline: false },
                        { name: "Time spent AFK (in minutes): ", value: user.timeAFK[i], inline: false },
                        { name: "You joined this server on: ", value: user.dateJoined[i], inline: false },
                        { name: "Number of succesful summons: ", value: user.summoner[i], inline: false },
                    ]
                }
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
    let gameEmbed = {
        ...Embed,
        fields: []
    }

    for (let i = 0; i < searches.length; i++) {

        let query = searches[i];
        if (query.length > 0) {


            gameEmbed = {
                ...Embed,
                date: new Date(),
                description: `Here are the results for: ${query}`,
                fields: []
            }

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

    let miscEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` Miscellaneous Commands`,
        description: `You can find out more information about any command by typing ${prefix}help *Command*`,
        fields: []
    }

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(3))
            miscEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: miscEmbed });
}

function helpStats(message, params, user) {

    let newEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` Stats Commands`,
        description: `You can find out more information about any command by typing ${prefix}help *Command*`,
        fields: []
    }

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(2))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}

function helpMusic(message, params, user) {

    let newEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` Music Commands`,
        description: `You can find out more information about any command by typing ${prefix}help *Command*`,
        fields: []
    }

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(4))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}

function gameHelp(message, params, user) {

    let newEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` Game Commands`,
        description: `You can find out more information about any command by typing ${prefix}help *Command*`,
        fields: []
    }

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}

function generalHelp(message, params, user) {

    let newEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` General Help`,
        description: `You can find out more information about any command or group by typing ${prefix}help *Command*` + "```1) " + prefix + "help Games" + "\n2) " + prefix + "help Ping" + "```",
        fields: [
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
        ]
    }

    for (tag of tags) {

        for (let i = 0; i < Commands.commands.length; i++) {

            if (Commands.subsection[i].includes(tag)) {

                newEmbed.fields[tag - 1].value += Commands.commands[i] + "\n"
            }
        }
    }


    message.channel.send({ embed: newEmbed });
}

function gameHelp(message, params, user) {

    let newEmbed = {
        ...Embed,
        date: new Date(),
        title: Embed.title + ` Game Commands`,
        description: `You can find out more information about any command by typing ${prefix}help *Command*`,
        fields: []
    }

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

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

            console.log(`ori: ${game}`)
            let check = checkGame(user.games, game, user);
            console.log(`pori: ${game}`)
            if (check == -1) {

                message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
                return -1;
            }
            else if (check.result[0].score != 0) {

                let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

                removeEmbed = {
                    ...Embed,
                    date: new Date(),
                    description: `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
                    fields: []
                }

                for(suggestion of prettyArray)
                    removeEmbed.fields.push({name: suggestion, value: "** **"});

                message.channel.send({embed: removeEmbed});
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

        let finalEmbed = {
            ...Embed,
            date: new Date(),
            fields: []
        }


        if (invalidGames.length > 0) {
            invalidGames.sort();
            let invalidGameField = {name: "Invalid Game(s)", value: ""};
            for (let i = 0; i < invalidGames.length; i++) {
                //if (invalidGames[i].length > 1)
               invalidGameField.value += (i+1) + ") " + invalidGames[i];
            }
            finalEmbed.fields.push(invalidGameField);
        }

        if (removedGames.length > 0) {
            removedGames.sort();
            let removedGameField = {name: "Removed Game(s)", value: ""};
            for (let i = 0; i < removedGames.length; i++) {
                //if (tempArr[i].length > 1)
                removedGameField.value += (i+1) + ") " + removedGames[i];
            }
            finalEmbed.fields.push(removedGameField);
        }

        message.channel.send({embed: finalEmbed});


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

            message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
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

        message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
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
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) { queue.get(message.guild.id).dispatcher.pause(); }
}

async function skip(message) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) {
        queue.get(message.guild.id).songs.shift();
        playSong(message.guild, queue.get(message.guild.id).songs[0]);
    }
}

async function stop(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) {
        queue.get(message.guild.id).voiceChannel.leave();
        queue.delete(message.guild.id);
    }
}

async function resume(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) { queue.get(message.guild.id).dispatcher.resume(); }
}

async function play(message) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
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




    //     // let tempArr = [];

    //     // for(let i = 0; i < user.guilds.length; i++){

    //     //     tempArr.push("-1");
    //     // }


    //     // await User.findOneAndUpdate({id: user.id}, {$set: {prefix: tempArr}, defaultPrefix: "-1"}, function(err, doc, res){});

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

            message.channel.send("You have entered an invalid option please try again or enter **-1** to exit the suggestion.");
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


//set up automated help/explanation text -> now just automate !help+command :)

//make ping take a 2nd paramter, for number of people needed.
//People can do !join to join a running ping, if there is more than 1 - givem them a menu selection

//add an @mention permission check for pinging


//DM quality of life (for now its just prefixes?) - prefix tutorial
//for game stats, add a Y/N for seeing a list of all the people signed up for it

//make a game recommendation


//for the game tutorial add a continuation showing the remaining extra commands, they can either cover them or skip them - make it Y/N
//if they dont, they can always start it by saying prefixADVANCEDGAMETUTORIAL - which is a seperate tutorial all together. If they want to do it to type that command



//For game stats and top games, you can list the people under each heading!!! Make sure to add a limit of 25 fields/games!!!

//Be alerted if a user is found in a voice channel? Stalker lmao
//play https://www.youtube.com/watch?v=cKzFsVfRn-A when sean joins, then kick everyone.

//Stats Tutorial

//coin flipper
//game decider
//roll command - for however many sided die
//ping-pong command
//add a timer
//shake user # of times

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