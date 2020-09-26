const net = require('net');
var os = require('os-utils');
const config = require('./config.json');
const leagueScraper = require('./Scrapers/leagueLegends.js');
const rocketScraper = require('./Scrapers/RocketLeague.js')
const twitchLogic = require('./serverLogic/twitchLogic');
const User = require('./User.js');
const Guild = require('./Guild.js')
const http = require("http");
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');

const fs = require('fs');
var uniqid = require('uniqid');
var token;
var uri;
var PORT;
var HOST;

const { Client, Intents } = require('discord.js');
const main = require('ytsr');
const { create } = require('domain');
const { isObject } = require('util');
const myIntents = new Intents();
myIntents.add('GUILDS', 'GUILD_MEMBERS');
const client = new Client({ ws: { intents: myIntents } });
const logID = '712000077295517796';
exports.logID = logID;
const creatorID = '99615909085220864';
exports.creatorID = creatorID;
const botID = '689315272531902606';
exports.botID = botID;
const guildID = '97354142502092800';
exports.guildID = guildID;
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

if (process.argv.length == 3) {

    uri = config.uri;
    token = config.token;
    HOST = config.IP;
    PORT = config.PORT;
}
else {
    uri = config.uri;
    token = config.TesterToken;
    defaultPrefix = "##";
    HOST = '127.0.0.1';
    PORT = config.PORT;
}

// const Cryptr = require('cryptr');
// const cryptr = new Cryptr(config.KEY);
// exports.cryptr = cryptr;


var algorithm = 'aes-256-gcm',
    password = crypto.createHash('sha256').update(String(config.KEY)).digest('base64').substr(0, 32);

function encrypt(text) {
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

function decrypt(encrypted) {
    var decipher = crypto.createDecipheriv(algorithm, password, encrypted.iv)
    decipher.setAuthTag(encrypted.tag);
    var dec = decipher.update(encrypted.content, 'hex', 'utf8')
    dec += decipher.final('utf8');
    return dec;
}




mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);
const connectDB = mongoose.connection;
var commandMap = new Map();
{
    commandMap.set('league_stats', leagueScraper.leagueStats);
    commandMap.set('follow_twitch_channel', twitchLogic.followTwitchChannel);
    commandMap.set('unfollow_twitch_channel', twitchLogic.unfollowTwitchChannel);
    commandMap.set('view_twitch_follows', twitchLogic.viewTwitchFollows);
    commandMap.set('show_channel_twitch_links', twitchLogic.showChannelTwitchLinks);
    commandMap.set('remove_channel_twitch_link', twitchLogic.removeChannelTwitchLink);
    commandMap.set('link_twitch', twitchLogic.linkTwitch);
    commandMap.set('link_channel_with_twitch', twitchLogic.linkChannelWithTwitch);
    commandMap.set('check_guild_twitch_streams', twitchLogic.checkGuildTwitchStreams);
    commandMap.set('check_user_twitch_streams', twitchLogic.checkUsersTwitchStreams);
    commandMap.set('rocket_league_ranks', rocketScraper.rocketLeagueRanks);
    commandMap.set('rocket_league_tracker', rocketScraper.RLTracker);
}

var workQueue = {
    active: [],
    backlog: [],
    limit: 1000
};
var cpu;
var memory;
async function updateResources() {
    os.cpuUsage((v) => { cpu = v; return true; });
    memory = os.freemem();
}
updateResources();
setInterval(updateResources, 5000)

async function showResources() {
    console.log(cpu)
    console.log(memory)
}
//setInterval(showResources, 5000)



async function countTalk() {

    for (let GUILD of client.guilds.cache) {

        let guild = client.guilds.cache.get(GUILD[0]);
        let channels = guild.channels.cache;
        // channelLoop:
        for (let CHANNEL of channels) {

            let channel = CHANNEL[1];

            if (channel.type == "voice") {

                for (let MEMBER of channel.members) {
                    if ((channel.members.size < 2) && (channel.id != guild.afkChannelID)) {
                        continue;
                    }
                    let member = MEMBER[1];
                    let user = findUser({ id: member.id })
                        .then((usy) => {
                            if (!usy) {
                                return console.log("Inside of count minute, user not found")
                            }
                            let index = usy.guilds.indexOf(guild.id);

                            if (channel.id == guild.afkChannelID) {

                                let timeAFK = usy.timeAFK;
                                timeAFK[index] += 1;

                                User.findOneAndUpdate({ id: member.id },
                                    {
                                        $set: { timeAFK: timeAFK }
                                    }, function (err, doc, res) {
                                        //console.log(doc);
                                    });
                            } else {

                                let timeTalked = usy.timeTalked;
                                timeTalked[index] += 1;

                                let lastTalked = usy.lastTalked;
                                lastTalked[index] = getDate();
                                //   console.log("Doing ")
                                User.findOneAndUpdate({ id: member.id },
                                    {
                                        $set: { timeTalked: timeTalked, lastTalked: lastTalked }
                                    }, function (err, doc, res) {
                                        //console.log(doc);
                                    });
                            }
                        });
                    // if (!user) {
                    //     console.log("found the null user: " + member.displayName + " || From: " + guild.name);
                    //     await checkExistance(member);
                    //     user = await findUser({ id: member.id });
                    //     console.log("AFTER CREATE: " + user);
                    // }
                }
            }
        }
    }
}
async function checkTwitch() {

    let guilds = await getGuilds();

    try {
        twitchLogic.checkGuildTwitchStreams(guilds);
        twitchLogic.checkUsersTwitchStreams(await getUsers());
        updateFactionTally(guilds);
    }
    catch (err) {
        console.log(err);
        console.log("Error with twitch checks!");
    }
}//eventualy check this to only get the guilds this shard or whatever is a part of

const updateFactionTally = async function (guilds) {

    for (let GUILD of guilds) {
        let guild = GUILD;


        if (!guild.factionLiveTally)
            continue;
        if (!guild.factionLiveTally.channelID)
            continue;


        let message = await client.guilds.cache.get(guild.id)
            .channels.cache.get(guild.factionLiveTally.channelID).messages.fetch(guild.factionLiveTally.messageID);

        let factions = guild.factions;

        let finalEmbedArray = [];

        for (let faction of guild.factions) {

            let finalText = `#Current standing: ${faction.points}\n`
                + `\nGeneral Contributions: ${faction.contributions.general}\n`
                + `\nNew Member Points: ${faction.contributions.newMembers}`
                + `\nMember Specific Contributions:\n`

            let memberContribution = '';

            faction.contributions.members.sort((a, b) => b.points - a.points)

            let limit = faction.contributions.members.length > 5 ? 5 : faction.contributions.members.length;

            for (let i = 0; i < limit; i++) {

                let member = faction.contributions.members[i];

                let actualyMember = await client.guilds.cache.get(guild.id).members.fetch(member.userID);


                memberContribution += `${i + 1})<${actualyMember.displayName.replace(/\s/g, '_')}`
                    + ` has contributed =${member.points} points!>\n`
            }

            finalText += memberContribution;
            finalEmbedArray.push({ name: faction.name, value: finalText });
        }

        let returnedEmbed = await prettyEmbed(null, finalEmbedArray, { modifier: 'md', embed: true });
        message.edit({ embed: returnedEmbed });
    }
}

const getEmoji = function (EMOJI) {
    EMOJI = EMOJI.trim().replace(' ', '');
    let emoji = client.guilds.cache.get(guildID).emojis.cache.find(emo => { return emo.name == EMOJI });
    if (!emoji) return '';
    // console.log("FINISHED EMOJI: ")
    // console.log(`<:${EMOJI}:${emoji.id}>`)
    return `<:${EMOJI}:${emoji.id}>`;
}
exports.getEmoji = getEmoji;

const getLeagueEmoji = function (EMOJI) {
    EMOJI = EMOJI.trim().replace(' ', '');
    let emoji = client.guilds.cache.get('689313920107675714').emojis.cache.find(emo => { return emo.name == EMOJI });
    if (!emoji) return '';
    // console.log("FINISHED EMOJI: ")
    // console.log(`<:${EMOJI}:${emoji.id}>`)
    return `<:${EMOJI}:${emoji.id}>`;
}
exports.getLeagueEmoji = getLeagueEmoji;

/**
 * 
 * @param {part, startTally, modifier, URL, title, description, selector, maxLength, embed} extraParams 
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
    let cutOff = extraParams.cutOff;
    let embedReturn = extraParams.embed ? extraParams.embed : false;

    let runningString = "";
    let previousName = "";
    let groupNumber = 1;
    let field = null;
    let fieldArray = [];

    let tester = 1;
    for (item of array) {

        let BIGSPLIT = false;

        // if((item.value == "** **") && (item.name == "** **")){
        //     fieldArray.push(item);
        //     continue;
        // }

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
                                client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send(`${newSplit} is too long to be included in the embeds. If this occured from normal use, please notify the creator with the **suggest** command!`);
                            }
                            else
                                tempRun += newSplit + "\n";
                            if (tempRun.length > maxLength) break;
                        }

                        tempElement = tempElement.substring(tempRun.length);
                        element = element.substring(0, tempRun.length);
                    }
                    else
                        client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send("Found an unsplittable message body, odds of that happening naturally are next-to-none so stop testing me D:< However, if this is indeed from normal use, please notify the creator with the **suggest** command.");
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
    return await testy(fieldArray, description, message, modifier, URL, title, selector, cutOff, embedReturn);
}
exports.prettyEmbed = prettyEmbed;

function createThreeQueue(array, cutOff) {

    let threeQueue = {
        queue: [[], [], []],
        index: 0
    };

    const CUT = cutOff ? cutOff : 4;

    let rows = Math.floor(array.length / 3);
    if ((array.length % 3) > 0) rows++;

    if (rows < CUT) {
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

async function testy(ARR, description, message, modifier, URL, title, selector, cutOff, embedReturn) {

    let newEmbed = JSON.parse(JSON.stringify(Embed));
    newEmbed.timestamp = new Date();
    newEmbed.description = description;
    newEmbed.title = title ? title : newEmbed.title;
    newEmbed.thumbnail.url = URL;

    let amount = ARR.length > 24 ? 24 : ARR.length;

    let threeQueue = createThreeQueue(ARR.splice(0, amount), cutOff)

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
        client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
        return testy(ARR, description, message, modifier);
    }

    if (embedReturn) {
        return newEmbed;
    }
    else if (!selector) {
        return await client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
    } else {
        let temp = await client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
        setControlEmoji(temp);
        return 20;
    }
}

async function queue(command, params, socket, newWork) {

    // console.log("Amount of work in the queue:")
    // console.log(workQueue.active.length)

    if (newWork) {
        //  if ((cpu < 0.9) && (memory > 50)) {
        if (workQueue.active.length < workQueue.limit) {
            workQueue.active.push({ command: command, params: params, socket: socket });
            return await queue(null, null, null, false);

        }
        else {
            workQueue.backlog.push({ command: command, params: params, socket: socket });
            return -1;
        }
    }//Need to write the result to a socket....
    if (workQueue.active.length > 0) {
        let currentTask = workQueue.active.shift();
        let result = await currentTask.command.apply(null, [currentTask.params, currentTask.socket]);

        if (result == -21) return 1;

        // if (!isNaN(result)) currentTask.socket.write(JSON.stringify({ status: result }));
        // else currentTask.socket.write(result);

        queue(null, null, null, false);

        if (!isNaN(result)) return { number: result };
        else return { status: result };
    }
    else if (workQueue.backlog.length > 0) {

        let currentTask = workQueue.backlog.shift();
        workQueue.active.push({ command: currentTask.command, params: currentTask.params, socket: currentTask.socket });
        queue(null, null, false);
        return 2;
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
const getUsers = async function () {
    try {
        return await User.find({})
    } catch (err) {
        MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
    }
}
exports.getUsers = getUsers;

const findUser = async function (params) {
    try {
        return await User.findOne(params)
    } catch (err) {
        MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
    }
}
exports.findUser = findUser;

const findGuild = async function (params) {
    try {
        return await Guild.findOne(params)
    } catch (err) {
        MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
    }
}
exports.findGuild = findGuild;

const getGuilds = async function () {
    try {
        return await Guild.find({})
    } catch (err) {
        MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
    }
}
exports.getGuilds = getGuilds;

const server = net.createServer(async (socket) => {

    socket.on('data', async (data) => {
        let dataParsed = JSON.parse(data.toString());
        queue(commandMap.get(dataParsed.command), dataParsed.params, socket, true);
        if (dataParsed.kill)
            socket.destroy();

        // let result = await commandMap.get(dataParsed.command).apply(null, [dataParsed.params, socket]);
        //     socket.write(JSON.stringify({ status: result }));

    })
    socket.on('error', (err) => {
        // Handle errors here.
        // console.log(err);
        // console.log("Caught socket error");
    });
    socket.on('close', (had_error) => {
        // console.log("socket closed");
        // console.log(had_error)
        socket.destroy();
        // console.log("destroyed the closed socket?");
    })
});

server.on('error', (err) => { console.log("Caught server error") })

// Grab an arbitrary unused PORT.
//'45.63.17.228'
//33432




// server.listen(PORT, HOST, () => {
//     console.log('opened server on', server.address());
// });

// server.on('connection', (socket) => { })




const requestListener = async function (req, res) {

    let payload;

    if ((!req.headers.payload) || (!req.headers.tag) || (!req.headers.iv)) return res.end();


    //Buffer.from(bufStr, 'utf8')

    try {
        payload = JSON.parse(decrypt(
            { content: req.headers.payload, tag: Buffer.from(req.headers.tag, 'base64'), iv: Buffer.from(req.headers.iv, 'base64') }
        ));
    }
    catch (err) {
        console.log(err);
        console.log("error trying to decrypt");
        return res.end();
    }

    if (payload.password != config.PASSWORD) {
        console.log("Incorrect password")
        return res.end();
    }

    if (commandMap.get(payload.command)) {

        res.writeHead(200);
        let functionRes = await commandMap.get(payload.command).apply(null, [payload.params]);
        let encrypted = encrypt(JSON.stringify(functionRes));

        return res.end(JSON.stringify({ payload: encrypted.content, tag: encrypted.tag.toString('base64'), iv: encrypted.iv.toString('base64') }));
    }
    res.end();
};

const HTTPserver = http.createServer(requestListener);
HTTPserver.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);

    console.log(decrypt(encrypt("WeeeOOO")))
});


async function createBackUp() {

    let userPath = path.join(__dirname, "backups", getDate() + ".json")
    let guildPath = path.join(__dirname, "backups", "guilds", getDate() + ".json")

    if (!fs.existsSync(userPath)) {

        let users = await getUsers();

        await fs.writeFile(userPath, JSON.stringify(users), function (err, result) {
            if (err) console.log('error', err);
        });
    }

    if (!fs.existsSync(guildPath)) {

        let guilds = await getGuilds();

        await fs.writeFile(guildPath, JSON.stringify(guilds), function (err, result) {
            if (err) console.log('error', err);
           // if (result) console.log(result)
        });
    }
}//


connectDB.once('open', async function () {

    await client.login(token);

    client.on("ready", () => {

        console.log("Ready!");
        exports.Client = client;
        checkRL();
        createBackUp();
        setInterval(createBackUp, 6 * 60 * 60 * 1000);
    });
    client.on('message', async (message) => {

        //  console.log(message.content);
    })
});

var county = 0;
async function minuteCount() {

    if (process.argv.length == 3) {
        countTalk();
        checkTwitch();
        // console.log(county++)
    }
}
setInterval(minuteCount, 60 * 1000);


const checkRL = async function () {

    let guilds = await Guild.find({ RLTracker: { $exists: true, $not: { $size: 0 } } });
    // console.log(guilds);
    rocketScraper.checkRLTrackers(guilds);

    //max - min + 1) + min
    let ms = Math.floor(((Math.random() * (5 - 1 + 1)) + 1) * 60000);
    //  console.log(`RANDOMISED: ${ms}`)
    setTimeout(checkRL, ms)
    //  console.log("GOT TO ENDDDD")
}

process.on('unhandledRejection', (reason, promise) => {


    console.log("Caught unhandledRejectionWarning")
    fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');

    
});

process.on('unhandledException', (reason, p) => {

    console.log("Caught unhandledException")
    fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');

    
});