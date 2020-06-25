const net = require('net');
var os = require('os-utils');
const config = require('./config.json');
const leagueScraper = require('./Scrapers/leagueLegends.js');
const rocketScraper = require('./Scrapers/RocketLeague.js')
const twitchLogic = require('./serverLogic/twitchLogic');
const User = require('./User.js');
const Guild = require('./Guild.js')
const mongoose = require('mongoose');

const fs = require('fs');
var uniqid = require('uniqid');
var token;
var uri;

const { Client, Intents } = require('discord.js');
const main = require('ytsr');
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
}
else {
    uri = config.uri;
    token = config.TesterToken;
    defaultPrefix = "##";
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
        channelLoop:
        for (let CHANNEL of channels) {

            let channel = CHANNEL[1];

            if (channel.type == "voice") {

                for (let MEMBER of channel.members) {
                    console.log("number of members: ")
                    console.log(channel.members.size)
                    if ((channel.members.size < 2) && (channel.id != guild.afkChannelID)) {
                        break channelLoop;
                    }
                    let member = MEMBER[1];
                    let user = findUser({ id: member.id })
                        .then((usy) => {
                            if (!usy) {
                                return console.log("Inside of count minute, user not found")
                            }
                            let index = usy.guilds.indexOf(guild.id);

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

                                let timeTalked = usy.timeTalked;
                                timeTalked[index] += 1;

                                let lastTalked = usy.lastTalked;
                                lastTalked[index] = getDate();
                                console.log("Doing ")
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
    try {
        twitchLogic.checkUsersTwitchStreams(await getUsers());
        twitchLogic.checkGuildTwitchStreams(await getGuilds());
    }
    catch (err) {
        console.log(err);
        console.log("Error with twitch checks!");
    }
}//eventualy check this to only get the guilds this shard or whatever is a part of
async function minuteCount() {

    if (process.argv.length != 3) {
        countTalk();
        checkTwitch();
    }
}
setInterval(minuteCount, 60 * 1000);







const getEmoji = function (EMOJI) {
    EMOJI = EMOJI.trim().replace(' ', '');
    let emoji = client.guilds.cache.get(guildID).emojis.cache.find(emo => { return emo.name == EMOJI });
    if (!emoji) return '';
    console.log("FINISHED EMOJI: ")
    console.log(`<:${EMOJI}:${emoji.id}>`)
    return `<:${EMOJI}:${emoji.id}>`;
}
exports.getEmoji = getEmoji;

async function prettyEmbed(message, description, array, part, startTally, modifier, URL, title, selector) {

    let runningString = "";
    let previousName = "";
    let groupNumber = 1;
    let tally = startTally == 0 ? startTally : 1;
    let field = null;
    let fieldArray = [];
    let maxLength = 100;

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
                if (startTally == -1)
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
        client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
        return testy(ARR, description, message, modifier);
    }

    if (!selector) {
        return await client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
    } else {
        let temp = await client.guilds.cache.get(message.guildID).channels.cache.get(message.channelID).send({ embed: newEmbed });
        setControlEmoji(temp);
        return 20;
    }
}

async function queue(command, params, socket, newWork) {


    console.log(workQueue.active.length)

    if (newWork) {
        //  if ((cpu < 0.9) && (memory > 50)) {
        if (workQueue.active.length < workQueue.limit) {
            workQueue.active.push({ command: command, params: params, socket: socket });
            queue(null, null, null, false);
            return 1;
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

        if (!isNaN(result)) currentTask.socket.write(JSON.stringify({ status: result }));
        else currentTask.socket.write(result);
        queue(null, null, null, false);
        return result;
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
        console.log(err);
        console.log("Caught socket error");
    });
    socket.on('close', (had_error) => {
        console.log("socket closed");
        console.log(had_error)
        socket.destroy();
        console.log("destroyed the closed socket?");
    })
});

server.on('error', (err) => { console.log("Caught server error") })

// Grab an arbitrary unused port.
//'45.63.17.228'
server.listen('33432', '45.63.17.228', () => {
    console.log('opened server on', server.address());
});
server.on('connection', (socket) => { })


connectDB.once('open', async function () {

    await client.login(token);


    client.on("ready", () => {

        console.log("Ready!");
        exports.Client = client;
        checkTwitch();
    });
    client.on('message', async (message) => {

        console.log(message.content);
    })
});