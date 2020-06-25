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
}

var workQueue = {
    active: [],
    backlog: []
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

        for (let CHANNEL of channels) {

            let channel = CHANNEL[1];

            if (channel.type == "voice") {

                for (let MEMBER of channel.members) {
                    console.log("number of members: ")
                    console.log(channel.members.size)
                    if (channel.members.size < 1) {
                        break;
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
}
async function minuteCount() {
    countTalk();
    checkTwitch();
}
setInterval(minuteCount, 60 * 1000);











async function queue(command, params, socket, newWork) {
    if (newWork) {
        if ((cpu < 0.9) && (memory > 50)) {
            workQueue.active.push({ command: command, params: params, socket: socket });
            queue(null, null, false);
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