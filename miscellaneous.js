const Fuse = require('fuse.js');
const studyJSON = require('./medstudy.json');
const MAIN = require('./short-answer.js');
//const twitchConfig = require('./twitch.json');
const User = require('./User.js');
const Guild = require('./Guild.js')
//const TeemoJS = require('teemojs');
//const api = TeemoJS(MAIN.league);
const studyArray = new Array();
const net = require('net');
var needle = require('needle');

//http://ddragon.leagueoflegends.com/cdn/10.12.1/data/en_US/champion.json

var regionsEZ = ['br', 'eune', 'euw', 'jp', 'kr', 'lan', 'las', 'na', 'oce', 'tr', 'ru', 'pbe'];
var regionsExact = ['br1', 'eun1', 'euw1', 'jp1', 'kr', 'la1', 'la2', 'na1', 'oc1', 'tr1', 'ru', 'pbe1'];
var dataDragon = new Map();
var championKeys = new Map();
// {
//     version: '10.12.1',
//     id: 'Zyra',
//     key: '143',
//     name: 'Zyra',
//     title: 'Rise of the Thorns',
//     blurb: 'Born in an ancient, sorcerous catastrophe, Zyra is the wrath of nature given form—an alluring hybrid of plant and human, kindling new life with every step. She views the many mortals of Valoran as little more than prey for her seeded progeny, and thinks...',
//     info: { attack: 4, defense: 3, magic: 8, difficulty: 7 },
//     image: {
//       full: 'Zyra.png',
//       sprite: 'champion4.png',
//       group: 'champion',
//       x: 336,
//       y: 96,
//       w: 48,
//       h: 48
//     },
//     tags: [ 'Mage', 'Support' ],
//     partype: 'Mana',
//     stats: {
//       hp: 504,
//       hpperlevel: 79,
//       mp: 418,
//       mpperlevel: 25,
//       movespeed: 340,
//       armor: 29,
//       armorperlevel: 3,
//       spellblock: 30,
//       spellblockperlevel: 0.5,
//       attackrange: 575,
//       hpregen: 5.5,
//       hpregenperlevel: 0.5,
//       mpregen: 13,
//       mpregenperlevel: 0.4,
//       crit: 0,
//       critperlevel: 0,
//       attackdamage: 53.376,
//       attackdamageperlevel: 3.2,
//       attackspeedperlevel: 2.11,
//       attackspeed: 0.625
//     }
//   }


async function populateDataDragon() {

    {
        dataDragon.set("br1", {});
        dataDragon.set("eun1", {});
        dataDragon.set("euw1", {});
        dataDragon.set("jp1", {});
        dataDragon.set("kr", {});
        dataDragon.set("la1", {});
        dataDragon.set("la2", {});
        dataDragon.set("na1", {});
        dataDragon.set("oc1", {});
        dataDragon.set("tr1", {});
        dataDragon.set("ru", {});
        dataDragon.set("pbe1", {});
    }

    for (let i = 0; i < regionsEZ.length; i++) {
        let region = regionsEZ[i];
        let I = i;
        needle('get', `https://ddragon.leagueoflegends.com/realms/${region}.json`)
            .then(resp => {
                needle('get', `http://ddragon.leagueoflegends.com/cdn/${resp.body.n.champion}/data/en_US/champion.json`)
                    .then(resp1 => {
                        if (I == 0) {
                            for (let champ in resp1.body.data) {
                                championKeys.set(Number(resp1.body.data[champ].key), resp1.body.data[champ]);
                            }
                        }
                        dataDragon.set(regionsExact[I], { championInfo: resp1.body.data })
                    })
            });
    }
}
populateDataDragon();


for (let element of studyJSON)
    studyArray.push(element);


async function getSummoner(zone, name) {

    let summoner = await api.req(zone, 'lol.summonerV4.getBySummonerName', name);
    //  console.log(summoner)
    return summoner;
}

async function getLeagueEntries(zone, summoner) {

    let entries = await api.req(zone, 'lol.leagueV4.getLeagueEntriesForSummoner', summoner.id);
    console.log(entries);
}

async function getMatchInfo(zone, summoner) {

    let matches = await api.req(zone, 'lol.matchV4.getMatchlist', summoner.accountId, { season: [13] });
    if (!matches) return -1;

    if (matches.totalGames > matches.endIndex) {
        let numRequests = (matches.endIndex - 100) / 100;
        let promises = [];
        for (let i = 1; i <= numRequests; i++) {
            promises.push(api.req(zone, 'lol.matchV4.getMatchlist', summoner.accountId, { season: [13], beginIndex: 100 * i }));
        }
        Promise.all(promises);
    }
    console.log(matches);
    console.log(matches.matches.length)
}

async function getChampionMastery(zone, summoner, topNum) {


    let mastery = await api.req(zone, 'lol.championMasteryV4.getAllChampionMasteries', summoner.id);
    let returnArray = [];
    let counter = 1;
    for (let master in mastery) {

        returnArray.push({
            name: "Champion Mastery", value: `Champion Name: ${championKeys.get((mastery[master].championId)).name}` +
                `\nChampion level: ${mastery[master].championLevel}\n`, level: mastery[master].championLevel, id: mastery[master].championId
        });
        counter++;
        if (topNum)
            if (counter == (topNum + 1))
                break;
    }

    returnArray.sort((a, b) => { return b.level - a.level })

    return returnArray;
}

async function leagueStats(message, params, user) {

    //if (!user.twitchFollows) user.twitchFollow = [];
    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if ((args.length == 0) && (!user.linkedLeague)) return message.channel.send("You don't have a league account linked, or did not provide at least a summoner name!");

    let zone = 'na';
    if (!params.looped) {
        if (args.length > 1) {
            zone = args[1].toLowerCase();
            if (regionsEZ.includes(zone)) {
                zone = regionsEZ[regionsEZ.indexOf(zone)];
            }
            else
                return MAIN.generalMatcher(message, zone, user, regionsEZ,
                    regionsEZ.reduce((accum, current) => { accum.push({ looped: true, region: current }); return accum; }, []),
                    leagueStats, "Please indicate which region you wanted to search!");
        }
    }
    else
        zone = params.region;

    let start;
    let summonerTotalInfo;
    let summonerRankedInfo;
    let summonerFlexInfo;
    let messagy;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in get stats") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {
        socky.write(JSON.stringify({ command: 'league_stats', params: [args[0], zone] }))
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed);

        if (parsed.status == -1) {
            message.channel.send(`${args[0]} in the region *${zone}* does not exist, try again?`);
            socky.destroy();
            if (messagy) messagy.delete();
            return -1;
        }
        if (parsed.position) {

            if (parsed.position <= -1) {
                start = new Date();
                if (!messagy) messagy = await message.channel.send("Now processing your request!");
                else messagy.edit("Now processing your request!");
            }
            else if (parsed.position > 0) {
                if (!messagy) messagy = await message.channel.send("Wow, this command seems to be really popular, your position in queue is: " + parsed.position);
                else messagy.edit("Wow, this command seems to be really popular, your position in queue is: " + parsed.position);
            }
        }

        if (stringed.includes("totalStats")) {
            summonerTotalInfo = JSON.parse(stringed).totalStats;
        }
        if (stringed.includes("rankedSolo")) {
            summonerRankedInfo = JSON.parse(stringed).rankedSolo;
        }
        if (stringed.includes("rankedFlex")) {
            summonerFlexInfo = JSON.parse(stringed).rankedFlex;

            console.log(summonerTotalInfo)
            console.log(summonerRankedInfo)
            console.log(summonerFlexInfo)

            message.channel.send(`It took ${((new Date() - start) / 1000)} seconds to get your request`);

            MAIN.prettyEmbed(message, "Here are the Leage of Legends stats for: " + summonerTotalInfo.name,
                [
                    {
                        name: "Previous Ranks", value: `${summonerTotalInfo.previousRanks.reduce((accum, current, index) => { return `${current}\n${accum}`; }, '')}`
                    },
                    {
                        name: `Overall Win Rate: ${((Number(summonerTotalInfo.totalWins) / Number(summonerTotalInfo.totalLoses))).toFixed(2)}`, value: [`Total Games: ${summonerTotalInfo.totalGames}`, `Total Wins: ${summonerTotalInfo.totalWins}`,
                        `Total Loses: ${summonerTotalInfo.totalLoses}`
                        ]
                    },
                    {
                        name: `KDA: ${(((Number(summonerTotalInfo.averageAssists) + Number(summonerTotalInfo.averageKills))) / Number(summonerTotalInfo.averageDeaths)).toFixed(2)}`, value: [
                            `Average Kills: ${summonerTotalInfo.averageKills}`, `Average Deaths: ${summonerTotalInfo.averageDeaths}`, `Average Assists: ${summonerTotalInfo.averageAssists}`,
                            `K/D Ratio: ${((Number(summonerTotalInfo.averageKills) / Number(summonerTotalInfo.averageDeaths))).toFixed(2)}`
                        ]
                    }
                ], -1, -1, 1);
            socky.destroy();
        }
    })

    return -1;
}
exports.leagueStats = leagueStats;

const RLRanks = async function (message, params, user) {

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if ((args.length == 0) && (!user.linkedLeague)) return message.channel.send("You don't have a Rocket League account linked, or did not provide at least a summoner name!");

    let zones = ['steam', 'ps', 'xbox'];
    let zone = zones[0];


    if (!params.looped) {
        if (args.length > 1) {
            zone = args[1].toLowerCase();
            if (zones.includes(zone)) {
                zone = zones[zones.indexOf(zone)];
            }
            else
                return MAIN.generalMatcher(message, zone, user, zones,
                    zones.reduce((accum, current) => { accum.push({ looped: true, region: current }); return accum; }, []),
                    RLRanks, "Please indicate which platform you wanted to search!");
        }
    }
    else
        zone = params.region;

    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in get stats") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {
        socky.write(JSON.stringify({ command: 'rocket_league_ranks', params: [zone, args[0], message.guild.id, message.channel.id] }))
    });
    socky.on('close', (had_error) => {
        console.log("socket closed");
        console.log(had_error)
        socky.destroy();
        console.log("destroyed the closed socket?");
    })

    return -1;
}
exports.RLRanks = RLRanks;

async function getTwitchChannel(streamer) {
    const user = await MAIN.twitchClient.helix.users.getUserByName(streamer);
    return user;
}

async function getTwitchChannelByID(id) {
    const user = await MAIN.twitchClient.helix.users.getUserById(id);
    return user;
}

async function followTwitchChannel(message, params, user) {

    if (!user.twitchFollows) user.twitchFollow = [];
    let args = message.content.split(" ").slice(1).join(" ").trim();
    if (!args) {

        message.channel.send("Try again with the name of the streamer you want to follow!");
        return -1;
    }

    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in get stats") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {
        socky.write(JSON.stringify({ command: 'follow_twitch_channel', params: [args, user.twitchFollows, user.linkedTwitch] }))
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed);

        if (parsed.status) {
            status = parsed.status;
            switch (parsed.status) {
                case -1:
                    message.channel.send("I could not find such a channel, try again?");
                    socky.destroy();
                    break;
                case -2:
                    message.channel.send("You're already following this channel!");
                    socky.destroy();
                    break;
                case -3:
                    message.channel.send("You can't follow your own linked twitch!");
                    socky.destroy();
                    break;
            }
        }
        else if (parsed.result) {
            User.findOneAndUpdate({ id: user.id }, { $set: { twitchFollows: parsed.result } }, function (err, doc, res) { });
            return message.channel.send(`Succesfully added ${parsed.targetChannelName} to your follow list!`);
        }
    })

    return -1;
}
exports.followTwitchChannel = followTwitchChannel;

async function unfollowTwitchChannel(message, params, user) {


    if (!user.twitchFollows) return message.channel.send("You do not have twitch channels being followed!");
    if (user.twitchFollows.length == 0) return message.channel.send("You do not have twitch channels being followed!");
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to specify the name of the channel you wish to unfollow!");

    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in unfollowtwitch") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {
        if (!params.looped)
            socky.write(JSON.stringify({ command: 'unfollow_twitch_channel', params: [args, user.twitchFollows] }))
        else
            socky.write(JSON.stringify({ command: 'unfollow_twitch_channel', params: [params.channel, user.twitchFollows, true] }))
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed);

        if (parsed.channelNames) {

            console.log('inside of if')
            MAIN.generalMatcher(message, args, user, parsed.channelNames, parsed.internalArray, unfollowTwitchChannel, "Select which channel you meant to remove:");
            socky.destroy();
            status = -1;
        }//147711920
        else if (parsed.twitchFollows) {
            console.log('inside of else if')
            console.log(parsed.twitchFollows)
            User.findOneAndUpdate({ id: user.id }, { $set: { twitchFollows: parsed.twitchFollows } }, function (err, doc, res) { if (err) console.log(err) });
            message.channel.send(`Successfully removed ${parsed.name} from your follows!`);
            socky.destroy();
            status = 1;
        }
    });

    return status;
}
exports.unfollowTwitchChannel = unfollowTwitchChannel;

async function viewTwitchFollows(message, params, user) {

    if (!user.twitchFollows) return message.channel.send("You do not have twitch channels being followed!");
    if (user.twitchFollows.length == 0) return message.channel.send("You do not have twitch channels being followed!");

    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in unfollowtwitch") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {

        socky.write(JSON.stringify({ command: 'view_twitch_follows', params: [user.twitchFollows] }));
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed).finalArray;

        MAIN.prettyEmbed(message, `You are following ${parsed.length} channels!`, parsed,
            -1, 1, 'md');
        status = 1;
        socky.destroy();
    });

    return status;
}
exports.viewTwitchFollows = viewTwitchFollows;

async function showChannelTwitchLinks(message, params, user) {

    let guild = await MAIN.findGuild({ id: message.guild.id });

    if (!guild.channelTwitch || (guild.channelTwitch.length == 0)) return message.channel.send("There are no pairs setup for this server!");


    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in unfollowtwitch") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {

        socky.write(JSON.stringify({ command: 'show_channel_twitch_links', params: [guild.channelTwitch] }));
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed).promiseArray;

        let promiseArray = [];
        let textChannels = [];

        for (follow of guild.channelTwitch) {
            textChannels.push(message.guild.channels.cache.get(follow[1]));
        }


        let finishedArray = [];

        for (let i = 0; i < parsed.length; i++) {
            finishedArray.push({ texty: textChannels[i], streamy: parsed[i] });
        }

        finishedArray.sort((a, b) => { return b.streamy._data.view_count - a.streamy._data.view_count });

        MAIN.prettyEmbed(message, "Here are the ServerChannel-TwitchStreamer pairs:",
            finishedArray.reduce((accum, current) => {
                accum.push({ name: '', value: `<#${current.texty.name} is linked to=${current.streamy._data.display_name}>\n` });
                return accum;
            }, []), -1, 1, 'md');

        status = 1;
        socky.destroy();
    });

    return status;
}
exports.showChannelTwitchLinks = showChannelTwitchLinks;

async function removeChannelTwitchLink(message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    let guild = await MAIN.findGuild({ id: message.guild.id });

    if (!guild.channelTwitch || (guild.channelTwitch.length == 0)) return message.channel.send("There are no pairs setup for this server!");

    if (!message.mentions.channels.length != 1) return message.channel.send("You have to mention a channel to remove the twitch notifications from!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if (args.length != 2) return message.channel.send("You did not specify a proper twitch streamer/text channel combo!");



    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in removeTwitchPair") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {

        socky.write(JSON.stringify({ command: 'remove_channel_twitch_link', params: [args[0]] }));
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed).streamer;


        if (!guild.channelTwitch) guild.channelTwitch = [];

        for (let i = 0; i < guild.channelTwitch.length; i++) {
            if (message.mentions.channels.first().id == guild.channelTwitch[i][1]) {
                if (parsed._data.id == guild.channelTwitch[i][0]) {
                    guild.channelTwitch.splice(i, 1);
                    Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { channelTwitch: guild.channelTwitch } }, function (err, doc, res) { });
                    status = 1;
                    socky.destroy();
                    message.channel.send(`Successfully unlinked ${parsed._data.display_name} and <#${message.mentions.channels.first().id}>`);
                    return status;
                }
            }
        }
        message.channel.send("No such pair exists for this server, try again?");
        status = 1;
        socky.destroy();
    });
    return status;
}
exports.removeChannelTwitchLink = removeChannelTwitchLink;

async function unlinkTwitch(message, params, user) {

    if (!user.linkedTwitch) return message.channel.send("You do not have a linked twitch, try linking one first?");

    if (user.twitchFollows && !params.looped) {
        if (user.twitchFollows.length > 0)
            if (!params.looped)
                return MAIN.generalMatcher(message, -23, user, ['Keep', 'Remove'],
                    [{ looped: true, keep: true, followArr: user.twitchFollows },
                    { looped: true, keep: false, followArr: [] }],
                    unlinkTwitch, "Do you want to keep your current follows?");
    }
    else {

        User.findOneAndUpdate({ id: user.id }, { $set: { linkedTwitch: null, twitchFollows: params.followArr } }, function (err, doc, res) { });
        return message.channel.send("Succesfully unlinked your twitch!" + ` You now have ${params.followArr.length} channels still being followed!`);
    }
}
exports.unlinkTwitch = unlinkTwitch;

async function linkTwitch(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You did not provide the name of the channel you wish to link to!");

    if (!params.looped) {
        let status;
        let socky = new net.Socket();
        socky.on('error', (err) => { console.log("socket error in LinkTwitch") });

        socky.connect(MAIN.PORT, MAIN.IP, () => {

            socky.write(JSON.stringify({ command: 'link_twitch', params: [args, user.twitchLinks] }));
        });

        socky.on('data', async (data) => {
            let stringed = data.toString();
            let parsed = JSON.parse(stringed);

            if (parsed.status) {
                status = -1;
                message.channel.send("I could not find a channel with that name, try again?")
            }
            else {

                linkTwitch(message, { looped: true, streamer: parsed.streamer, goodArray: parsed.goodArray }, user);
                status = 1;
                socky.destroy();
            }
        });
        return status;
    }
    else {

        if (params.keep) {
            console.log(params.streamer)
            User.findOneAndUpdate({ id: user.id }, { $set: { linkedTwitch: params.streamer._data.id, twitchFollows: params.followArr } }, function (err, doc, res) { });
            message.channel.send(`Succesfully linked ${params.streamer._data.display_name} to your account, you now have ${params.followArr.length} channels you are following!`);
            return 1;
        }
        else if (user.twitchFollows && (user.twitchFollows.length > 0)) {

            if (user.twitchFollows.length > 0)
                return MAIN.generalMatcher(message, -23, user, ['Combine', 'Remove'],
                    [{ streamer: params.streamer, looped: true, keep: 1, followArr: params.goodArray.concat(user.twitchFollows.filter(item => !params.goodArray.includes(item))) },
                    { streamer: params.streamer, looped: true, keep: -1, followArr: params.goodArray }],
                    linkTwitch, "You already have a linked twitch account or channels you have followed, would you like to combine the old follows, or remove them?");
        }
        else {
            return linkTwitch(message, { looped: true, followArr: params.goodArray, keep: -3, streamer: params.streamer }, user);
        }
    }
}
exports.linkTwitch = linkTwitch;

async function linkChannelWithTwitch(message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    if (!message.mentions.channels.length != 1) return message.channel.send("You have to mention a channel to put the twitch notifications in!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if (args.length != 2) return message.channel.send("You did not specify a proper twitch streamer/text channel combo!");

    let guild = await MAIN.findGuild({ id: message.guild.id });
    if (!guild.channelTwitch) guild.channelTwitch = [];

    let ID = message.mentions.channels.first().id

    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in link_channel_with_twitch") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {

        socky.write(JSON.stringify({ command: 'link_channel_with_twitch', params: [args[0], guild.channelTwitch, ID] }));
    });
    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed);

        if (parsed.status) {
            if (parsed.status == -1) {
                message.channel.send("I could not find a streamer with that name, try again?");
                result = -1;
                socky.destroy();
            }
            else {
                message.channel.send("Such a ServerChannel - TwitchStreamer pair already exists!");
                result = -2;
                socky.destroy();
            }
        }
        else {
            Guild.findOneAndUpdate({ id: guild.id }, { $set: { channelTwitch: parsed.channelTwitch } }, function (err, doc, res) { if (err) console.log(err) });
            message.channel.send(`Successfully paired ${args[0]} with <#${ID}>`);
            status = 1;
            socky.destroy();
        }
    });
    return status;
}
exports.linkChannelWithTwitch = linkChannelWithTwitch;

async function shakeUser(message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You must be in a server voice channel and send the command from a server!");
    if (message.mentions.members.size != 1) return message.channel.send("You must mention only/at least one user!");

    let targetMember = message.mentions.members.first();
    if (targetMember.id == MAIN.botID) return message.channel.send("I'm not going to shake myself!");
    if (!message.member.permissions.has("ADMINISTRATOR"))
        if (message.member.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0)
            return message.channel.send("You can't shake a user with a higher role than yours (unless you're an admin)!");

    let startingChannel = targetMember.voice.channel;
    if (!startingChannel) return message.channel.send("The user needs to be in this server's voice channel!");


    let voiceChannels = message.guild.channels.cache.filter(channel => channel.type == 'voice').filter(channel => channel.permissionsFor(targetMember).has('CONNECT')).array();
    voiceChannels = voiceChannels.filter(channel => !channel.full);

    let backUpVoiceChannels = [];

    for (channel of voiceChannels) {
        if (channel.members.size != 0)
            backUpVoiceChannels.push(channel);
    }

    voiceChannels = voiceChannels.filter(channel => channel.members.size == 0);

    if ((voiceChannels.size == 0) && (backUpVoiceChannels.length == 0)) return message.channel.send("There are no other possible channels to move the user to!");

    if (voiceChannels.size == 0)
        voiceChannels = backUpVoiceChannels;

    if (voiceChannels.length == 1) return message.channel.send(`There are no other voice channels that ${targetMember.displayName} can be moved to!`);

    let args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");

    while (args.includes('<')) {
        args = args.substring(0, args.indexOf('<')) + args.substring(args.indexOf('>') + 1);
    }

    args = Math.floor(Number(args));

    if ((args <= 0) || (args > 20)) return message.channel.send("You can shake a user a max of 20 times, and at least once!");

    let previousChannel = startingChannel;
    let newChannel = startingChannel;

    for (let i = 0; i < args; i++) {

        while (previousChannel == newChannel) {

            newChannel = voiceChannels[Math.floor(Math.random() * args)];
        }

        targetMember.voice.setChannel(newChannel);
        previousChannel = newChannel;
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    targetMember.voice.setChannel(startingChannel);
}
exports.shakeUser = shakeUser;

async function populate(message, params) {
    for (i = 1; i <= params[0]; i++) {

        await message.channel.send(i).then(sent => {

            reactAnswers(sent);
        });
    }
    message.delete();
}
exports.populate = populate;

async function searchForUser(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");
    if (!args && (message.mentions.members.size < 1)) return message.reply("You need to provide the name/mention a user to search for!");

    if (message.mentions.members.size > 0) {

        let goal = message.mentions.members.values().next().value.id;

        for (guild of MAIN.Client.guilds.cache.values()) {
            for (channel of guild.channels.cache.values()) {
                if (channel.type == "voice") {
                    if (channel.members.size > 0)
                        for (member of channel.members.values()) {
                            if (member.id == goal)
                                return message.channel.send("```diff\n" + `${member.displayName} was found in:\n+Server: ${guild.name}\n-Channel: ${channel.name}` + "```");
                        }
                }
            }
        }
    }
    else {
        for (guild of MAIN.Client.guilds.cache.values()) {
            for (channel of guild.channels.cache.values()) {
                if (channel.type == "voice") {
                    if (channel.members.size > 0)
                        for (member of channel.members.values()) {
                            if (member.displayName == args)
                                return message.channel.send("```diff\n" + `${member.displayName} was found in:\n+Server: ${guild.name}\n-Channel: ${channel.name}` + "```");
                        }
                }
            }
        }
    }
    return message.channel.send("I didn't find the user in any of my servers!");
}
exports.searchForUser = searchForUser;

async function flipCoin(message, params, user) {

    if (!params.step) {
        let messa = await message.channel.send("Flipping coin...");
        return setTimeout(flipCoin, 750, messa, { step: 1 }, user);
    }

    switch (params.step) {

        case 1:
            message.edit(message.content + "\n\\");
            break;
        case 2:
            message.edit(message.content + "\n |");
            break;
        case 3:
            message.edit(message.content + "\n/");
            break;
        case 4:
            message.edit(message.content + "\n__");
            break;
        case 5:

            let coin = Math.floor(Math.random() * 2) == 0 ? "Tails!" : "Heads!";
            message.edit(message.content + `\n${coin}`);
            break;
    }

    params.step++;
    if (params.step != 6)
        setTimeout(flipCoin, 750, message, { step: params.step }, user);
}
exports.flipCoin = flipCoin;

async function roll(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");
    if (isNaN(args) || (args.length < 1)) return message.channel.send("You need to enter a number.");
    if (Number.MAX_SAFE_INTEGER < Number(args)) return message.channel.send("That number is too large.");

    if (args)
        return message.channel.send(`${user.displayName} rolled a ${Math.floor((Math.random() * args) + 1)}`);
    return message.channel.send(`${user.displayName} rolled a ${Math.floor((Math.random() * 20) + 1)}`);
}
exports.roll = roll;

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
exports.study = study;

async function decider(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ").split(",");

    if (!args) return message.channel.send("You have to provide at least 1 option!");
    return message.channel.send(`I have chosen: ${args[Math.floor(Math.random() * args.length)]}`)
}
exports.decider = decider;

async function checkGuildTwitchStreams(guilds) {
    let guildArray = [];
    for (let guild of guilds) {
        guildArray.push({ channelTwitch: guild.channelTwitch, twitchNotifications: guild.twitchNotifications, id: guild.id });
    }

    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in check_guild_twitch_streams") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {

        socky.write(JSON.stringify({ command: 'check_guild_twitch_streams', params: [guildArray] }));
    });

    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed).completeArray;

        for (entry of parsed) {

            MAIN.Client.guilds.cache.get(entry.guildID).channels.cache.get(entry.channelID).send(entry.alertMessage);
            Guild.findOneAndUpdate({ id: entry.guildID }, { $set: { twitchNotifications: entry.twitchNotifications } }, function (err, doc, res) { if (err) console.log(err) });
        }
        status = 1;
        socky.destroy();
    });
    return status;
}
exports.checkGuildTwitchStreams = checkGuildTwitchStreams;

async function checkUsersTwitchStreams(users) {

    let userArray = [];
    for (let user of users) {
        if (user.twitchFollows.length > 0)
            userArray.push({ twitchFollows: user.twitchFollows, twitchNotifications: user.twitchNotifications, id: user.id });
    }


    let status;
    let socky = new net.Socket();
    socky.on('error', (err) => { console.log("socket error in check_user_twitch_streams") });

    socky.connect(MAIN.PORT, MAIN.IP, () => {
        socky.write(JSON.stringify({ command: 'check_user_twitch_streams', params: [userArray] }));
    });

    socky.on('data', async (data) => {
        let stringed = data.toString();
        let parsed = JSON.parse(stringed).completeArray;
        console.log(parsed);
        for (entry of parsed) {
            for (let guild of MAIN.Client.guilds.cache.values()) {

                let member = guild.members.cache.get(entry.userID);
                if (!member) continue;
                console.log(member.displayName)
                member.send(entry.alertMessage);
                User.findOneAndUpdate({ id: entry.userID }, { $set: { twitchNotifications: entry.twitchNotifications } }, function (err, doc, res) { if (err) console.log(err) });
                status = 1;
                socky.destroy();
                return status;
            }
        }
        status = -1;
        socky.destroy();
    });
    return status;
}
exports.checkUsersTwitchStreams = checkUsersTwitchStreams;


async function reactAnswers(message) {

    await message.react("🇦");
    await message.react("🇧");
    await message.react("🇨");
    await message.react("🇩");
    await message.react("🇪");
    await message.react("🇫");
}