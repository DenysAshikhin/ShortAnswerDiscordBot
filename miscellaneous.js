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
const {
    parse
} = require('path');
const {
    create
} = require('./User.js');
const {
    mem
} = require('node-os-utils');
const {
    reset
} = require('nodemon');

//http://ddragon.leagueoflegends.com/cdn/10.12.1/data/en_US/champion.json

//sometimes 'pbe' should be in there
var regionsEZ = ['br', 'eune', 'euw', 'jp', 'kr', 'lan', 'las', 'na', 'oce', 'tr', 'ru'];
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
                        dataDragon.set(regionsExact[I], {
                            championInfo: resp1.body.data
                        })
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

}

async function getMatchInfo(zone, summoner) {

    let matches = await api.req(zone, 'lol.matchV4.getMatchlist', summoner.accountId, {
        season: [13]
    });
    if (!matches) return -1;

    if (matches.totalGames > matches.endIndex) {
        let numRequests = (matches.endIndex - 100) / 100;
        let promises = [];
        for (let i = 1; i <= numRequests; i++) {
            promises.push(api.req(zone, 'lol.matchV4.getMatchlist', summoner.accountId, {
                season: [13],
                beginIndex: 100 * i
            }));
        }
        Promise.all(promises);
    }
}

async function getChampionMastery(zone, summoner, topNum) {


    let mastery = await api.req(zone, 'lol.championMasteryV4.getAllChampionMasteries', summoner.id);
    let returnArray = [];
    let counter = 1;
    for (let master in mastery) {

        returnArray.push({
            name: "Champion Mastery",
            value: `Champion Name: ${championKeys.get((mastery[master].championId)).name}` +
                `\nChampion level: ${mastery[master].championLevel}\n`,
            level: mastery[master].championLevel,
            id: mastery[master].championId
        });
        counter++;
        if (topNum)
            if (counter == (topNum + 1))
                break;
    }

    returnArray.sort((a, b) => {
        return b.level - a.level
    })

    return returnArray;
}

async function leagueStats(message, params, user) {

    //if (!user.twitchFollows) user.twitchFollow = [];
    let args = message.content.split(" ").slice(1).join(' ').split(',');

    // console.log(user.linkedLeague)
    if ((!args[0])) return message.channel.send("You did not provide at least a summoner name!");

    let zone = 'na';
    if (!params.looped) {
        if (args.length > 1) {
            zone = args[1].toLowerCase();
            if (regionsEZ.includes(zone)) {
                zone = regionsEZ[regionsEZ.indexOf(zone)];
            } else
                return MAIN.generalMatcher(message, zone, user, regionsEZ,
                    regionsEZ.reduce((accum, current) => {
                        accum.push({
                            looped: true,
                            region: current
                        });
                        return accum;
                    }, []),
                    leagueStats, "Please indicate which region you wanted to search!");
        }
    } else
        zone = params.region;

    MAIN.sendToServer({
        command: 'league_stats',
        params: [zone, args[0], message.guild.id, message.channel.id]
    });

    return -1;
}
exports.leagueStats = leagueStats;

const RLRanks = async function (message, params, user) {

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    // console.log(user.linkedLeague)
    if ((!args[0])) return message.channel.send("You did not provide at least a summoner name!");

    let zones = ['steam', 'ps', 'xbox'];
    let zone = zones[0];


    if (!params.looped) {
        if (args.length > 1) {
            zone = args[1].toLowerCase();
            if (zones.includes(zone)) {
                zone = zones[zones.indexOf(zone)];
            } else
                return MAIN.generalMatcher(message, zone, user, zones,
                    zones.reduce((accum, current) => {
                        accum.push({
                            looped: true,
                            region: current
                        });
                        return accum;
                    }, []),
                    RLRanks, "Please indicate which platform you wanted to search!");
        }
    } else
        zone = params.region;

    MAIN.sendToServer({
        command: 'rocket_league_ranks',
        params: [zone, args[0], message.guild.id, message.channel.id]
    });
    return -1;
}
exports.RLRanks = RLRanks;

const RLTracker = async function (message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    if (!(message.mentions.channels.size == 1)) return message.channel.send("You have to mention a channel to put the notifications in!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    // console.log(user.linkedLeague)
    if ((!args[0])) return message.channel.send("You did not provide at least a player's name!");

    //  if (args.length != 2) return message.channel.send("You did not specify a proper player + text-channel combo!");


    if (args[0].includes('<#')) {

        message.channel.send(`You have entered invalid arguments. Make sure to seperate the **player name** and the channel with a *comma*.` +
            ` Use the **help rlTracker** command to get a better example!`);
        return -1
    }
    // if (args[0].includes('<#'))
    //     args[0] = args[0].substring(0, args[0].indexOf('<#') - 1)
    // if (args.length == 3)
    //     if (args[1].includes('<#'))
    //         args[1] = args[0].substring(0, args[1].indexOf('<#') - 1)

    let zones = ['steam', 'ps', 'xbox'];
    let zone = zones[0];

    if (!params.looped) {
        if (args.length > 2) {
            zone = args[1].toLowerCase();
            if (zones.includes(zone)) {
                zone = zones[zones.indexOf(zone)];
            } else
                return await MAIN.generalMatcher(message, zone, user, zones,
                    zones.reduce((accum, current) => {
                        accum.push({
                            looped: true,
                            region: current
                        });
                        return accum;
                    }, []),
                    RLTracker, "Please indicate which platform you wanted to user!");
        }
    } else
        zone = params.region;


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    if (!guild.RLTracker) guild.RLTracker = [];

    let ID = message.mentions.channels.first().id

    let status;

    let parsed = await MAIN.sendToServer({
        command: 'rocket_league_tracker',
        params: [zone, args[0], guild.RLTracker, ID]
    });

    if (parsed.status) {
        if (parsed.status == -1) {
            message.channel.send("I could not find that player+platform combination, try again?");
            result = -1;
        } else {
            message.channel.send("Such a ServerChannel - Player pair already exists!");
            result = -2;
        }
    } else {
        Guild.findOneAndUpdate({
            id: guild.id
        }, {
            $set: {
                RLTracker: parsed.RLTracker
            }
        }, function (err, doc, res) {
            if (err) console.log(err)
        });
        message.channel.send(`Successfully paired ${args[0]} with <#${ID}>`);
        status = 1;
    }

    return status;
}
exports.RLTracker = RLTracker;

const UnlinkRLTracker = async function (message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    if (!(message.mentions.channels.size == 1)) return message.channel.send("You have to mention a channel to remove the notifications from!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    // console.log(user.linkedLeague)
    if ((!args[0])) return message.channel.send("You did not provide at least a player's name!");

    //  if (args.length != 2) return message.channel.send("You did not specify a proper player + text-channel combo!");

    if (args[0].includes('<#')) {

        message.channel.send(`You have entered invalid arguments. Make sure to seperate the **player name** and the channel with a *comma*.` +
            ` Use the **help removeRLTracker** command to get a better example!`);
        return -1
    }

    let zones = ['steam', 'ps', 'xbox'];
    let zone = zones[0];

    if (!params.looped) {
        if (args.length > 2) {
            zone = args[1].toLowerCase();
            if (zones.includes(zone)) {
                zone = zones[zones.indexOf(zone)];
            } else
                return MAIN.generalMatcher(message, zone, user, zones,
                    zones.reduce((accum, current) => {
                        accum.push({
                            looped: true,
                            region: current
                        });
                        return accum;
                    }, []),
                    UnlinkRLTracker, "Please indicate which platform you wanted to use!");
        }
    } else
        zone = params.region;

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    if (!guild.RLTracker) guild.RLTracker = [];

    let ID = message.mentions.channels.first().id

    for (let link of guild.RLTracker) {

        if (link.channelID == ID) {

            if ((link.player == args[0]) && (link.platform == zone)) {
                message.channel.send(`Succesfully removed ${link.player} on ${link.platform} from ${message.mentions.channels.first()}!`);
                guild.RLTracker.splice(guild.RLTracker.indexOf(link), 1);
                Guild.findOneAndUpdate({
                    id: message.guild.id
                }, {
                    $set: {
                        RLTracker: guild.RLTracker
                    }
                }, () => { });
                return 1;
            }
        }
    }

    message.channel.send(`Could not find ${link.player} on ${link.platform} notifications for ${message.mentions.channels.first()}!`);
    return -1;
}
exports.UnlinkRLTracker = UnlinkRLTracker;

const viewRLTrackers = async function (message, params, user) {

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.RLTracker || (guild.RLTracker.length == 0)) return message.channel.send("There are no trackers setup for this server!");

    // MAIN.prettyEmbed(message, "Here are the RLTrackers for this server:", guild.RLTracker.reduce((accum, curr) => {
    //     accum.push({name: '** **', value: `<#${message.guild.channels.cache.get(curr.channelID).name} is linked to=${curr.player}_${curr.platform}`});
    //     return accum;
    // }, []), -1, 1, 'md');

    MAIN.prettyEmbed(message, guild.RLTracker.reduce((accum, curr) => {
        accum.push({
            name: '** **',
            value: `<#${message.guild.channels.cache.get(curr.channelID).name} is linked to=${curr.player}_${curr.platform}>`
        });
        return accum;
    }, []), {
        description: "Here are the RLTrackers for this server:",
        modifier: 'md'
    });

    return 1;
}
exports.viewRLTrackers = viewRLTrackers;

async function followTwitchChannel(message, params, user) {

    if (!user.twitchFollows) user.twitchFollow = [];
    let args = message.content.split(" ").slice(1).join(" ").trim();
    if (!args) {

        message.channel.send("Try again with the name of the streamer you want to follow!");
        return -1;
    }

    let parsed = await MAIN.sendToServer({
        command: 'follow_twitch_channel',
        params: [args, user.twitchFollows, user.linkedTwitch]
    });

    if (parsed.status) {
        status = parsed.status;
        switch (parsed.status) {
            case -1:
                message.channel.send("I could not find such a channel, try again?");
                break;
            case -2:
                message.channel.send("You're already following this channel!");
                break;
            case -3:
                message.channel.send("You can't follow your own linked twitch!");
                break;
        }
    } else if (parsed.result) {
        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                twitchFollows: parsed.result
            }
        }, function (err, doc, res) { });
        return message.channel.send(`Succesfully added ${parsed.targetChannelName} to your follow list!`);
    }
    return -1;
}
exports.followTwitchChannel = followTwitchChannel;

async function unfollowTwitchChannel(message, params, user) {


    if (!user.twitchFollows) return message.channel.send("You do not have twitch channels being followed!");
    if (user.twitchFollows.length == 0) return message.channel.send("You do not have twitch channels being followed!");
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to specify the name of the channel you wish to unfollow!");

    let status;

    let parsed;


    if (!params.looped)
        parsed = await MAIN.sendToServer({
            command: 'unfollow_twitch_channel',
            params: [args, user.twitchFollows]
        });
    else
        parsed = await MAIN.sendToServer({
            command: 'unfollow_twitch_channel',
            params: [params.channel, user.twitchFollows, true]
        });


    if (parsed.channelNames) {

        return MAIN.generalMatcher(message, args, user, parsed.channelNames, parsed.internalArray, unfollowTwitchChannel, "Select which channel you meant to remove:");
    } //147711920
    else if (parsed.twitchFollows) {

        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                twitchFollows: parsed.twitchFollows
            }
        }, function (err, doc, res) {
            if (err) console.log(err)
        });
        message.channel.send(`Successfully removed ${parsed.name} from your follows!`);
    }

    return 1;
}
exports.unfollowTwitchChannel = unfollowTwitchChannel;

async function viewTwitchFollows(message, params, user) {

    if (!user.twitchFollows) return message.channel.send("You do not have twitch channels being followed!");
    if (user.twitchFollows.length == 0) return message.channel.send("You do not have twitch channels being followed!");

    let parsed = await MAIN.sendToServer({
        command: 'view_twitch_follows',
        params: [user.twitchFollows]
    });
    return MAIN.prettyEmbed(message, parsed.finalArray, {
        description: `You are following ${parsed.finalArray.length} channels!`,
        startTally: 1,
        modifier: 'md',
        maxLength: 150
    });
}
exports.viewTwitchFollows = viewTwitchFollows;

async function showChannelTwitchLinks(message, params, user) {

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelTwitch || (guild.channelTwitch.length == 0)) return message.channel.send("There are no pairs setup for this server!");

    let parsed = await MAIN.sendToServer({
        command: 'show_channel_twitch_links',
        params: [guild.channelTwitch]
    });

    let promiseArray = parsed.promiseArray;
    let textChannels = [];

    for (follow of guild.channelTwitch) {
        textChannels.push(message.guild.channels.cache.get(follow[1]));
    }

    let finishedArray = [];

    for (let i = 0; i < promiseArray.length; i++) {
        finishedArray.push({
            texty: textChannels[i],
            streamy: promiseArray[i]
        });
    }

    finishedArray.sort((a, b) => {
        return b.streamy._data.view_count - a.streamy._data.view_count
    });

    return MAIN.prettyEmbed(message, finishedArray.reduce((accum, current) => {
        accum.push({
            name: '',
            value: `<#${current.texty.name} is linked to=${current.streamy._data.display_name}>\n`
        });
        return accum;
    }, []), {
        description: "Here are the ServerChannel-TwitchStreamer pairs:",
        startTally: 1,
        modifier: 'md'
    });
}
exports.showChannelTwitchLinks = showChannelTwitchLinks;

async function removeChannelTwitchLink(message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelTwitch || (guild.channelTwitch.length == 0)) return message.channel.send("There are no pairs setup for this server!");

    if (!(message.mentions.channels.size == 1)) return message.channel.send("You have to mention a channel to remove the twitch notifications from!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if (args.length != 2) return message.channel.send("You did not specify a proper twitch streamer/text channel combo!");

    let parsed = await MAIN.sendToServer({
        command: 'remove_channel_twitch_link',
        params: [args[0]]
    });

    if (parsed.streamer) {
        parsed = parsed.streamer;

        if (!guild.channelTwitch) guild.channelTwitch = [];

        for (let i = 0; i < guild.channelTwitch.length; i++) {
            if (message.mentions.channels.first().id == guild.channelTwitch[i][1]) {
                if (parsed._data.id == guild.channelTwitch[i][0]) {
                    guild.channelTwitch.splice(i, 1);
                    Guild.findOneAndUpdate({
                        id: message.guild.id
                    }, {
                        $set: {
                            channelTwitch: guild.channelTwitch
                        }
                    }, function (err, doc, res) { });
                    return message.channel.send(`Successfully unlinked ${parsed._data.display_name} and <#${message.mentions.channels.first().id}>`);
                }
            }
        }
        message.channel.send("No such pair exists for this server, try again?");
    } else
        return message.channel.send("No such pair exists for this server, try again?");

    return 1;
}
exports.removeChannelTwitchLink = removeChannelTwitchLink;

async function unlinkTwitch(message, params, user) {

    if (!user.linkedTwitch) return message.channel.send("You do not have a linked twitch, try linking one first?");

    if (user.twitchFollows && !params.looped) {
        if (user.twitchFollows.length > 0)
            if (!params.looped)
                return MAIN.generalMatcher(message, -23, user, ['Keep', 'Remove'],
                    [{
                        looped: true,
                        keep: true,
                        followArr: user.twitchFollows
                    },
                    {
                        looped: true,
                        keep: false,
                        followArr: []
                    }
                    ],
                    unlinkTwitch, "Do you want to keep your current follows?");
    } else {

        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                linkedTwitch: null,
                twitchFollows: params.followArr
            }
        }, function (err, doc, res) { });
        return message.channel.send("Succesfully unlinked your twitch!" + ` You now have ${params.followArr.length} channels still being followed!`);
    }
}
exports.unlinkTwitch = unlinkTwitch;

async function linkTwitch(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You did not provide the name of the channel you wish to link to!");

    if (!params.looped) {

        let parsed = await MAIN.sendToServer({
            command: 'link_twitch',
            params: [args.trim(), user.twitchLinks]
        });

        if (parsed.status) {

            message.channel.send("I could not find a channel with that name, try again?")
            return -1;
        } else {

            return await linkTwitch(message, {
                looped: true,
                streamer: parsed.streamer,
                goodArray: parsed.goodArray
            }, user);
        }
    } else {

        if (params.keep) {
            User.findOneAndUpdate({
                id: user.id
            }, {
                $set: {
                    linkedTwitch: params.streamer._data.id,
                    twitchFollows: params.followArr
                }
            }, function (err, doc, res) { });
            message.channel.send(`Succesfully linked ${params.streamer._data.display_name} to your account, you now have ${params.followArr.length} channels you are following!`);
            return 1;
        } else if (user.twitchFollows && (user.twitchFollows.length > 0)) {

            if (user.twitchFollows.length > 0)
                return await MAIN.generalMatcher(message, -23, user, ['Combine', 'Remove'],
                    [{
                        streamer: params.streamer,
                        looped: true,
                        keep: 1,
                        followArr: params.goodArray.concat(user.twitchFollows.filter(item => !params.goodArray.includes(item)))
                    },
                    {
                        streamer: params.streamer,
                        looped: true,
                        keep: -1,
                        followArr: params.goodArray
                    }
                    ],
                    linkTwitch, "You already have a linked twitch account or channels you have followed, would you like to combine the old follows, or remove them?");
        } else {
            return await linkTwitch(message, {
                looped: true,
                followArr: params.goodArray,
                keep: -3,
                streamer: params.streamer
            }, user);
        }
    }
}
exports.linkTwitch = linkTwitch;

async function linkChannelWithTwitch(message, params, user) {

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can use this command!");

    if (!(message.mentions.channels.size == 1)) return message.channel.send("You have to mention a channel to put the twitch notifications in!");

    let args = message.content.split(" ").slice(1).join(' ').split(',');

    if (args.length != 2) return message.channel.send("You did not specify a proper twitch streamer/text channel combo!");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    if (!guild.channelTwitch) guild.channelTwitch = [];

    let ID = message.mentions.channels.first().id

    let parsed = await MAIN.sendToServer({
        command: 'link_channel_with_twitch',
        params: [args[0].trim(), guild.channelTwitch, ID]
    });
    let result;
    let status;

    if (parsed.status) {
        if (parsed.status == -1) {
            message.channel.send("I could not find a streamer with that name, try again?");
            result = -1;
        } else {
            message.channel.send("Such a ServerChannel - TwitchStreamer pair already exists!");
            result = -2;
        }
    } else {
        Guild.findOneAndUpdate({
            id: guild.id
        }, {
            $set: {
                channelTwitch: parsed.channelTwitch
            }
        }, function (err, doc, res) {
            if (err) console.log(err)
        });
        message.channel.send(`Successfully paired ${args[0]} with <#${ID}>`);
        status = 1;

    }

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
    } else {
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
        return setTimeout(flipCoin, 750, messa, {
            step: 1
        }, user);
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
        setTimeout(flipCoin, 750, message, {
            step: params.step
        }, user);
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
                    } else if (!finalObject[index].refIndex.includes(found.refIndex)) {

                        let itemString = found.item.charAt(0).toLowerCase() + found.item.slice(1);
                        itemString = itemString.replace(/[\r\n,.(){}:;`~!@#$%^&*-_=+|]+/g, " ").trim();
                        finalObject[index].items.push(itemString);
                        finalObject[index].refIndex.push(found.refIndex);
                    }
                } //result loop
            } //searchWords loops
        } //slide loop
    } //ppt loop

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

        finalObject.sort(function (a, b) {
            return b.items.length - a.items.length
        });

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
    } else {
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
        guildArray.push({
            channelTwitch: guild.channelTwitch,
            twitchNotifications: guild.twitchNotifications,
            id: guild.id
        });
    }

    let parsed = await MAIN.sendToServer({
        command: 'check_guild_twitch_streams',
        params: [guildArray]
    });
    parsed = parsed.completeArray;

    for (entry of parsed) {

        MAIN.Client.guilds.cache.get(entry.guildID).channels.cache.get(entry.channelID).send(entry.alertMessage);
        Guild.findOneAndUpdate({
            id: entry.guildID
        }, {
            $set: {
                twitchNotifications: entry.twitchNotifications
            }
        }, function (err, doc, res) {
            if (err) console.log(err)
        });
    }

    return 1;
}
exports.checkGuildTwitchStreams = checkGuildTwitchStreams;

async function checkUsersTwitchStreams(users) {

    let userArray = [];
    for (let user of users) {
        if (user.twitchFollows.length > 0)
            userArray.push({
                twitchFollows: user.twitchFollows,
                twitchNotifications: user.twitchNotifications,
                id: user.id
            });
    }


    let parsed = await MAIN.sendToServer({
        command: 'check_user_twitch_streams',
        params: [userArray]
    });
    parsed = parsed.completeArray;

    for (entry of parsed) {
        for (let guild of MAIN.Client.guilds.cache.values()) {

            let member = guild.members.cache.get(entry.userID);
            if (!member) continue;
            member.send(entry.alertMessage);
            User.findOneAndUpdate({
                id: entry.userID
            }, {
                $set: {
                    twitchNotifications: entry.twitchNotifications
                }
            }, function (err, doc, res) {
                if (err) console.log(err)
            });
            return 1;
        }
    }

    return 1;
}
exports.checkUsersTwitchStreams = checkUsersTwitchStreams;



const createFaction = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only create a faction from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can create factions")

    if (message.content.split(" ").slice(1).join(" ").split(",").length != 2)
        return message.channel.send("You have to provide the name and @role seperated by a comma. For more information use the **help createFaction** command!");

    let args = message.content.split(" ").slice(1).join(" ").split(",")[0];

    if (!args) {
        message.channel.send("You have to provde a name for the new faction!");
        return -1;
    }

    args = args.trim();

    if (message.mentions.roles.size != 1)
        return message.channel.send("You have to @mention a single role to link the faction to!");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let existingPair = guild.factions.find(element =>
        ((element.role == message.mentions.roles.first()) || (element.name == args))
    );

    if (existingPair)
        return message.channel.send(`Either a faction named ${args} exists or ${MAIN.mentionRole(message.mentions.roles.first().id)} is already assigned a faction!`);


    guild.factions.push({
        role: message.mentions.roles.first().id,
        name: args,
        points: 0,
        contributions: {
            general: 0,
            newMembers: 0,
            members: []
        }
    });

    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            factions: guild.factions
        }
    }, function (err, doc, res) {
        if (err) console.log(err)
    });

    message.channel.send(`The faction: **${args}** has been created and linked to${MAIN.mentionRole(message.mentions.roles.first().id)}!`);
}
exports.createFaction = createFaction;

const factionPoints = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only award/deduct points from inside a server text channel!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can award/deduct points")

    const args = Number(message.content.split(" ").slice(1).join(" ").split(",")[0].trim());
    const tempArgs = message.content.split(" ").slice(1);

    if (!args) {
        message.channel.send("You have to provde a value for the points to award/deduct!");
        return -1;
    }
    if (isNaN(args))
        return message.channel.send("You have to provide either a positive or negative number to award/deduct!");

    if (message.mentions.roles.size > 1)
        return message.channel.send("You can only @mention a single role!");
    if (message.mentions.users.size > 1)
        return message.channel.send("You can only @mention a single user!");

    if (message.mentions.roles.size == 1)
        if (message.mentions.users.size == 1)
            return message.channel.send("You have to @mention either a single role or user to award/deduct points!");

    if ((message.mentions.roles.size == 0) && (message.mentions.users.size == 0) && (tempArgs.length != 2))
        return message.channel.send("You either have to @mention a single role or user to award/deduct points or type the name of the faction!");

    let guild = (await MAIN.findGuild({
        id: message.guild.id
    })).factions;

    let factionModify;

    if (message.mentions.roles.size == 1) {

        factionModify = guild.findIndex(element => element.role == message.mentions.roles.first().id);
        if (factionModify == -1)
            return message.channel.send(`There is no faction tied to ${MAIN.mentionRole(message.mentions.roles.first().id)}`);

        guild[factionModify].points += args;
        guild[factionModify].contributions.general += args;
        message.channel.send(`**${guild[factionModify].name}** is now at ${guild[factionModify].points} points!`);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                factions: guild
            }
        }, function (err, doc, res) { });
    } else if (message.mentions.members.size == 1) {

        let memberRoles = message.guild.members.cache.get(message.mentions.users.first().id).roles.cache.keyArray();

        factionModify = guild.findIndex(element => memberRoles.includes(element.role));
        if (factionModify == -1)
            return message.channel.send(`${MAIN.mention(message.mentions.users.first().id)} is not part of any faction!`);

        guild[factionModify].points += args;

        let specificUser = guild[factionModify].contributions.members;
        if (specificUser.length == 0) {
            specificUser = {
                userID: message.mentions.users.first().id,
                points: args
            };
            guild[factionModify].contributions.members.push(specificUser);
        } else {
            specificUser = guild[factionModify].contributions.members.find(element => element.userID == message.mentions.users.first().id);

            if (specificUser) //might need cleaning up at some point but w/e
                specificUser.points += args;
            else {

                specificUser = {
                    userID: message.mentions.users.first().id,
                    points: args
                }

                guild[factionModify].contributions.members.push(specificUser);
            }
        }

        message.channel.send(`**${guild[factionModify].name}** is now at ${guild[factionModify].points} points!` +
            `\n${message.guild.members.cache.get(message.mentions.users.first().id).displayName} has contributed ${specificUser.points} points!`);

        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                factions: guild
            }
        }, function (err, doc, res) { });
    }
    else {

        factionModify = guild.findIndex(element => element.name == tempArgs[1]);
        if (factionModify == -1)
            return message.channel.send(`There is no faction tied to ${MAIN.mentionRole(message.mentions.roles.first().id)}`);

        guild[factionModify].points += args;
        guild[factionModify].contributions.general += args;
        message.channel.send(`**${guild[factionModify].name}** is now at ${guild[factionModify].points} points!`);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                factions: guild
            }
        }, function (err, doc, res) { });
    }

}
exports.factionPoints = factionPoints;

const viewFaction = async function (message, params, user) {

    if (params.looped) {
        let faction = params.faction;

        let finalText = `#Current standing: ${faction.points}\n` +
            `\nGeneral Contributions: ${faction.contributions.general}\n` +
            `\nMember Specific Contributions:\n`

        let memberContribution = '';

        for (let i = 0; i < faction.contributions.members.length; i++) {

            let member = faction.contributions.members[i];

            memberContribution += `${i + 1})<${message.guild.members.cache.get(member.userID).displayName.replace(/\s/g, '_')}` +
                ` has contributed =${member.points} points!>\n`
        }

        finalText += memberContribution;
        return MAIN.prettyEmbed(message, [{
            name: faction.name,
            value: finalText
        }], {
            modifier: 'md'
        });
    }

    let args = message.content.split(" ").slice(1).join(" ").split(",")[0].trim();
    if (args.length == 0)
        args = null;

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    await message.guild.members.fetch();

    if (guild.factions.length == 0)
        return message.channel.send("There are no factions in this server! Mods can create one using the **createFaction** command!");

    if (!args && (message.mentions.roles.size == 0)) {

        if (message.mentions.has())
            return message.channel.send("You can only either provide the name of a faction or @mention a role!");

        let finalEmbedArray = [];


        guild.factions.sort(function (a, b) { return b.points - a.points });

        let standingText = '';

        for (let i = 0; i < guild.factions.length; i++) {

            standingText += `${i + 1}: ${guild.factions[i].name} has ${guild.factions[i].points} points!\n`
        }


        finalEmbedArray.push({ name: `Overall Faction Standings`, value: standingText, inline: false });

        for (let faction of guild.factions) {

            let finalText = `#Current standing: ${faction.points}\n` +
                `\nGeneral Contributions: ${faction.contributions.general}\n` +
                `\nNew Member Points: ${faction.contributions.newMembers}\n` +
                `\nMember Specific Contributions:\n\n`

            finalEmbedArray.push({
                name: faction.name + ' Overview',
                value: finalText,
                inline: false
            });
            finalText = '';

            let memberContribution = '';

            faction.contributions.members = faction.contributions.members.filter((value) => { return value.points != 0; });

            faction.contributions.members.sort((a, b) => b.points - a.points);

            let limit = faction.contributions.members.length > 5 ? 5 : faction.contributions.members.length;

            for (let i = 0; i < limit; i++) {

                let member = faction.contributions.members[i];

                let guildMember = message.guild.members.cache.get(member.userID);

                if (guildMember)
                    memberContribution += `${i + 1})<${guildMember.displayName.replace(/\s/g, '_')}` +
                        ` has contributed =${member.points} points!>\n`
            }

            if (faction.contributions.members != 0) {
                finalText += memberContribution;

                finalEmbedArray.push({
                    name: faction.name + ' Member Contributions',
                    value: finalText,
                    inline: true
                });
            }
        }


        MAIN.prettyEmbed(message, finalEmbedArray, {
            modifier: 'md',
            order: false,
            maxLength: 200
        });
    } else if (message.mentions.roles.size > 0) {

        let faction = guild.factions.find(element => element.role == message.mentions.roles.first().id);
        if (!faction)
            return message.channel.send(`**${MAIN.mentionRole(message.mentions.roles.first().id)}** is not assigned to any existing faction!`);

        let finalText = `#Current standing: ${faction.points}\n` +
            `\nGeneral Contributions: ${faction.contributions.general}\n` +
            `\nNew Member Points: ${faction.contributions.newMembers}\n` +
            `\nMember Specific Contributions:\n\n`;

        finalEmbedArray.push({
            name: faction.name + ' Overview',
            value: finalText,
            inline: false
        });
        finalText = '';

        let memberContribution = '';
        faction.contributions.members = faction.contributions.members.filter((value) => { return value.points != 0; });
        faction.contributions.members.sort((a, b) => b.points - a.points);


        for (let i = 0; i < faction.contributions.members.length; i++) {

            let member = faction.contributions.members[i];

            let guildMember = message.guild.members.cache.get(member.userID);

            if (guildMember)

                memberContribution += `${i + 1})<${guildMember.displayName.replace(/\s/g, '_')}` +
                    ` has contributed =${member.points} points!>\n`
        }

        if (faction.contributions.members != 0)
            finalText += memberContribution;

        finalEmbedArray.push({
            name: faction.name + ' Member Contributions',
            value: finalText,
            inline: true
        });

    } else if (message.mentions.users.size > 0) {

        let memberRoles = message.guild.members.cache.get(message.mentions.users.first().id).roles.cache.keyArray();

        let faction = guild.factions.find(element => memberRoles.includes(element.role));
        if (!faction)
            return message.channel.send(`${MAIN.mention(message.mentions.users.first().id)} is not part of any faction!`);

        let finalText = `#Current standing: ${faction.points}\n` +
            `\nGeneral Contributions: ${faction.contributions.general}\n` +
            `\nNew Member Points: ${faction.contributions.newMembers}\n` +
            `\nMember Specific Contributions:\n\n`;

        finalEmbedArray.push({
            name: faction.name + ' Overview',
            value: finalText,
            inline: false
        });
        finalText = '';

        let memberContribution = '';
        faction.contributions.members = faction.contributions.members.filter((value) => { return value.points != 0; });
        faction.contributions.members.sort((a, b) => b.points - a.points);

        for (let i = 0; i < faction.contributions.members.length; i++) {

            let member = faction.contributions.members[i];

            memberContribution += `${i + 1})<${message.guild.members.cache.get(member.userID).displayName.replace(/\s/g, '_')}` +
                ` has contributed =${member.points} points!>\n`
        }

        if (faction.contributions.members != 0)
            finalText += memberContribution;

        finalEmbedArray.push({
            name: faction.name + ' Member Contributions',
            value: finalText,
            inline: true
        });
    } else if (args) {

        let faction = guild.factions.find(element => element.name == args);
        if (!faction) {

            return MAIN.generalMatcher(message, args, user, guild.factions.reduce((acc, current, index) => {
                acc.push(current.name);
                return acc;
            }, []), guild.factions.reduce((acc, current, index) => {
                acc.push({
                    faction: current,
                    looped: true
                });
                return acc;
            }, []), viewFaction, `**${args}** is not an existing faction! Please choose which one you meant: `);
        }

        let finalText = `#Current standing: ${faction.points}\n` +
            `\nGeneral Contributions: ${faction.contributions.general}\n` +
            `\nNew Member Points: ${faction.contributions.newMembers}\n` +
            `\nMember Specific Contributions:\n\n`;

        finalEmbedArray.push({
            name: faction.name + ' Overview',
            value: finalText,
            inline: false
        });
        finalText = '';

        let memberContribution = '';
        faction.contributions.members = faction.contributions.members.filter((value) => { return value.points != 0; });
        faction.contributions.members.sort((a, b) => b.points - a.points);

        for (let i = 0; i < faction.contributions.members.length; i++) {

            let member = faction.contributions.members[i];

            let guildMember = message.guild.members.cache.get(member.userID);

            if (guildMember)

                memberContribution += `${i + 1})<${guildMember.displayName.replace(/\s/g, '_')}` +
                    ` has contributed =${member.points} points!>\n`
        }

        if (faction.contributions.members != 0)
            finalText += memberContribution;

        finalEmbedArray.push({
            name: faction.name + ' Member Contributions',
            value: finalText,
            inline: true
        });
    }
}
exports.viewFaction = viewFaction;

const deleteFaction = async function (message, params, user) {

    let deleted;

    if (params.looped) {

        deleted = guild.factions.splice(params.factionIndex)[0];
        Guild.findOneAndUpdate({
            id: params.guildID
        }, {
            $set: {
                factions: guild.factions
            }
        }, function (err, doc, res) { });

        return message.channel.send(`${deleted.name} has been deleted! ${MAIN.mentionRole(deleted.role)} can now be assigned a new faction!`);
    }

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    if (guild.factions.length == 0)
        return message.channel.send("There are no faction in the server to delete!");

    if (message.channel.type == 'dm') return message.channel.send("You can only delete factions from inside a server text channel!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can delete factions");


    if (message.mentions.roles.size > 0) {
        let faction = guild.factions.findIndex(element => element.role == message.mentions.roles.first().id);
        if (faction != -1)
            return message.channel.send(`**${MAIN.mentionRole(message.mentions.roles.first().id)}** is not assigned to any existing faction!`);
        deleted = guild.factions.splice(faction)[0];
    } else {

        let args = message.content.split(" ").slice(1).join(" ").split(",")[0].trim();
        if (args.length == 0)
            args = null;

        if (!args)
            return message.channel.send("You have to either provide the name of the faction to delete or @mention the role!");

        let faction = guild.factions.findIndex(element => element.name == args);
        if (faction == -1) {

            return MAIN.generalMatcher(message, args, user, guild.factions.reduce((acc, current, index) => {
                acc.push(current.name);
                return acc;
            }, []), guild.factions.reduce((acc, current, index) => {
                acc.push({
                    factionIndex: index,
                    looped: true,
                    guildID: message.guild.id
                });
                return acc;
            }, []), deleteFaction, `**${args}** is not an existing faction! Please choose which one you meant: `);
        }

        deleted = guild.factions.splice(faction)[0];
    }

    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            factions: guild.factions
        }
    }, function (err, doc, res) { });

    message.channel.send(`${deleted.name} has been deleted! ${MAIN.mentionRole(deleted.role)} can now be assigned a new faction!`);
}
exports.deleteFaction = deleteFaction;

const resetFactions = async function (message, params, user) {

    if (params.looped)
        if (!params.wipe)
            return message.channel.send("Faction reset aborted!");
        else {
            let guild = await MAIN.findGuild({
                id: params.guildID
            });

            for (let faction of guild.factions) {

                faction.points = 0;
                faction.contributions.general = 0;
                faction.contributions.members = [];
                faction.contributions.newMembers = 0;
                // for (let member of faction.contributions.members) {
                //     member.points = 0;
                // }
            }
            Guild.findOneAndUpdate({
                id: params.guildID
            }, {
                $set: {
                    factions: guild.factions
                }
            }, function (err, doc, res) { });
            return params.channel.send("All factions have been reset!");
        }

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    if (guild.factions.length == 0)
        return message.channel.send("There are no faction in the server to reset!");

    if (message.channel.type == 'dm') return message.channel.send("You can only delete factions from inside a server text channel!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can delete factions");

    if (!params.looped)
        return MAIN.generalMatcher(message, -23, user, ['yes', 'no'], [{
            looped: true,
            wipe: true,
            guildID: message.guild.id,
            channel: message.channel
        },
        {
            looped: true,
            wipe: false
        }
        ],
            resetFactions, "You are about to reset all faction and member contributions. Are you sure you wish to proceed?");
}
exports.resetFactions = resetFactions;

const factionNewMemberAlertChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set faction new member alerts from inside a server text channel!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set the channel for new member alerts!");

    if (message.mentions.channels.size != 1)
        message.channel.send("You can only have a single #channel mentioned!");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    guild.factionNewMemberAlert = message.mentions.channels.first().id;
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            factionNewMemberAlert: guild.factionNewMemberAlert
        }
    }, function (err, doc, res) { });

    message.channel.send(`${MAIN.mentionChannel(guild.factionNewMemberAlert)} will now display new faction members!`);
}
exports.factionNewMemberAlertChannel = factionNewMemberAlertChannel;

const createFactionRunningTally = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a live Faction Tally from inside a server text channel!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set create/overwrite a live Faction Tally");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    await message.channel.send("Below will be the updated (once per minute) running tally of all factions!");

    let finalEmbedArray = [];

    for (let faction of guild.factions) {

        let finalText = `#Current standing: ${faction.points}\n` +
            `\nGeneral Contributions: ${faction.contributions.general}\n` +
            `\nNew Member Points: ${faction.contributions.newMembers}\n` +
            `\nMember Specific Contributions:\n`

        let memberContribution = '';

        faction.contributions.members.sort((a, b) => b.points - a.points)

        let limit = faction.contributions.members.length > 5 ? 5 : faction.contributions.members.length;

        for (let i = 0; i < limit; i++) {

            let member = faction.contributions.members[i];

            let guildMember = message.guild.members.cache.get(member.userID);

            if (guildMember)
                memberContribution += `${i + 1})<${message.guild.members.cache.get(member.userID).displayName.replace(/\s/g, '_')}` +
                    ` has contributed =${member.points} points!>\n`
        }

        finalText += memberContribution;
        finalEmbedArray.push({
            name: faction.name,
            value: finalText
        });
    }

    let tally = await MAIN.prettyEmbed(message, finalEmbedArray, {
        modifier: 'md'
    });

    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            factionLiveTally: {
                channelID: tally.channel.id,
                messageID: tally.id
            }
        }
    },
        function (err, doc, res) { });
}
exports.createFactionRunningTally = createFactionRunningTally;

const privacyPolicy = async function (message, params, user) {

    return message.channel.send("1) The data collected: " +
        "Short Answer Bot collects the background data about how you use discord (number of messages sent, date of last message, " +
        "time spent in a voice channel, time spent in an AFK channel) and data that you provide with consent." +
        "This includes the personall games list, music playlist, whether you want to be pinged/DM'ed for game summons. " +
        "Moreover any setting related information such as prefixes, and completed tutorials."

        +
        " 2) Why is this data required:" +
        "The data is required and used strictly to enable greater and more complex features on the bot. Some of the more" +
        " unique features would be down right impossible without knowing: your games list, music playlists, twitch follows" +
        " (again all of this information is only known if you choose to give it to the bot)."

        +
        "  3) How do I use this data:" +
        "  The data is used only when the relevant commands are requested by the users of the bot. I.E.: If someone is trying to " +
        "  find a people to play a game, then the bot check whether the requested game is in your games list."

        +
        "  4) Other than discord and users of the bot, who else sees this data. No one. I store this on a mongoDB database," +
        "  however it is encrypted. As such, beyond discord and the bot users, no third party has access to this information."

        +
        "  5) " +
        " The most reliable way to contact me is on discord (The Last Spark#7586), however, I can also be reached by email at" +
        " denysashikhin@gmail.com."

        +
        "  6) How can you remove the stored information:" +
        " With all commands that ask for information there is an associated command to remove that information. However, if you " +
        " want to ensure all, or some specific personal data is destroyed, contact me as mentioned in point 5) and I will " +
        " be more than happy to do so.")
}
exports.privacyPolicy = privacyPolicy;

async function reactAnswers(message) {

    await message.react("🇦");
    await message.react("🇧");
    await message.react("🇨");
    await message.react("🇩");
    await message.react("🇪");
    await message.react("🇫");
}