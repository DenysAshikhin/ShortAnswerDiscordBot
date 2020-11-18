//const TwitchClient = require('twitch').default;
var twitchClient;
//import { ApiClient } from 'twitch';
const { ApiClient } = require('twitch');
//import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth';
const { RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');

const twitchConfig = require('../twitch.json');
const MAIN = require('../scraper.js');
const fs = require('fs');
const User = require('../User.js');
const Guild = require('../Guild.js');


async function twitchInitiliasation() {

    let clienty = twitchConfig.twitchClient;
    let clientSecret = twitchConfig.twitchSecret;
    let accessy = twitchConfig.twitchAccess;
    let refreshy = twitchConfig.twitchRefresh;
    let expiry = twitchConfig.expiryTimestamp;

    // twitchClient = TwitchClient.withCredentials(clienty, accessy, undefined, {
    //     clientSecret,
    //     refreshToken: refreshy,
    //     expiry: expiry === null ? null : new Date(expiry),
    //     onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
    //         const newTokenData = {
    //             ...twitchConfig,
    //             twitchAccess: accessToken,
    //             twitchRefresh: refreshToken,
    //             expiryDate: expiryDate === null ? null : expiryDate.getTime()
    //         };
    //         await fs.promises.writeFile('./twitch.json', JSON.stringify(newTokenData), 'UTF-8');
    //     }
    // }
    // );
    //exports.twitchClient = twitchClient;


    const authProvider = new RefreshableAuthProvider(
        new StaticAuthProvider(clienty, accessy),
        {
            clientSecret,
            refreshToken: refreshy,
            expiry: expiry === null ? null : new Date(expiry),
            onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
                const newTokenData = {
                    ...twitchConfig,
                    twitchAccess: accessToken,
                    twitchRefresh: refreshToken,
                    expiryDate: expiryDate === null ? null : expiryDate.getTime()
                };
                await fs.promises.writeFile('./twitch.json', JSON.stringify(newTokenData), 'UTF-8');
            }
        }
    );
    twitchClient = new ApiClient({ authProvider });
    exports.twitchClient = twitchClient;
}
twitchInitiliasation();



async function checkGuildTwitchStreams(guilds) {
    //  console.log("CGHECKING GUILD")
    //return 1;
    let sendArray = [];
    let promiseArray = [];
    for (guild of guilds) {
        for (channel1 of guild.channelTwitch) {
            let GUILD1 = guild;
            let channel = channel1;
            // console.log(GUILD1.name)
            let channelByID = getTwitchChannelByID(channel[0])
                .then(async (streamer) => {
                    //   console.log('Got response for: ', GUILD1.name, '  ', GUILD1.id)
                    if (!streamer) {

                        GUILD1.channelTwitch.splice(GUILD1.channelTwitch.indexOf(channel1, 1));
                        Guild.findOneAndUpdate({ id: GUILD1.id }, { $set: { channelTwitch: GUILD1.channelTwitch } }).exec()
                        console.log('found null')
                        console.log(1)
                        fs.promises.writeFile(`logs/twitch-${uniqid()}.json`, JSON.stringify(`Deleted a twitch from: ${GUILD1.name}\n${GUILD1.id}`), 'UTF-8');
                        return;
                    }
                    //console.log(streamer.displayName)
                    let stream = await streamer.getStream();

                    if (stream) {

                        let found = false;
                        let index = -1;

                        if (!GUILD1.twitchNotifications) GUILD1.twitchNotifications = [];

                        for (let i = 0; i < GUILD1.twitchNotifications.length; i++) {
                            if (GUILD1.twitchNotifications[i][0] == stream._data.user_id) {
                                index = i;

                                if (GUILD1.twitchNotifications[i][1] == stream._data.id) {
                                    found = true;
                                }
                                break;
                            }
                        }

                        if (!found) {

                            if (index != -1)
                                GUILD1.twitchNotifications[index] = [stream._data.user_id, stream._data.id];
                            else
                                GUILD1.twitchNotifications.push([stream._data.user_id, stream._data.id]);


                            if (GUILD1.twitchHERE)
                                sendArray.push({
                                    twitchNotifications: GUILD1.twitchNotifications, guildID: GUILD1.id,
                                    alertMessage: `@here \n${stream._data.user_name} is live at: https://www.twitch.tv/${stream._data.user_name.split(' ').join('').trim()}`,
                                    channelID: channel[1]
                                });
                            else
                                sendArray.push({
                                    twitchNotifications: GUILD1.twitchNotifications, guildID: GUILD1.id,
                                    alertMessage: `${stream._data.user_name} is live at: https://www.twitch.tv/${stream._data.user_name.split(' ').join('').trim()}`,
                                    channelID: channel[1]
                                });
                        }
                    }
                });
            promiseArray.push(channelByID);
        }
    }
    await Promise.all(promiseArray);

    for (entry of sendArray) {

        let guildy = MAIN.Client.guilds.cache.get(entry.guildID);
        if (!guildy) continue;

        let cachy = guildy.channels.cache.get(entry.channelID);
        if (!cachy) continue;
        cachy.send(entry.alertMessage);
        Guild.findOneAndUpdate({ id: entry.guildID }, { $set: { twitchNotifications: entry.twitchNotifications } }, function (err, doc, res) { if (err) console.log(err) });
    }

    return 1;
}
exports.checkGuildTwitchStreams = checkGuildTwitchStreams;

async function checkUsersTwitchStreams(users) {
    // console.log("CGHECKING UUUUSER")
    let sendArray = [];
    let promiseArray = [];
    for (user1 of users) {
        for (channel of user1.twitchFollows) {
            let USER = user1;
            let twitchByChannel = getTwitchChannelByID(channel)
                .then(async (streamer) => {


                    if (!streamer) {

                        GUILD1.channelTwitch.splice(GUILD1.channelTwitch.indexOf(channel1, 1));
                        Guild.findOneAndUpdate({ id: GUILD1.id }, { $set: { channelTwitch: GUILD1.channelTwitch } }).exec()
                        console.log('found null')
                        console.log(1)
                        fs.promises.writeFile(`logs/twitch-${uniqid()}.json`, JSON.stringify(`Deleted a twitch from: ${USER.displayName}\n${USER.id}`), 'UTF-8');
                        return;
                    }


                    let stream = await streamer.getStream();
                    if (stream) {
                        let found = false;
                        let index = -1;

                        if (!USER.twitchNotifications) USER.twitchNotifications = [];

                        for (let i = 0; i < USER.twitchNotifications.length; i++) {
                            if (USER.twitchNotifications[i][0] == stream._data.user_id) {
                                index = i;

                                if (USER.twitchNotifications[i][1] == stream._data.id) {
                                    //       console.log(`${stream._data.display_name}'s stream has already been notifed of`)
                                    found = true;
                                }
                                break;
                            }
                        }
                        if (!found) {

                            if (index != -1)
                                USER.twitchNotifications[index] = [stream._data.user_id, stream._data.id];
                            else
                                USER.twitchNotifications.push([stream._data.user_id, stream._data.id]);

                            sendArray.push({
                                twitchNotifications: USER.twitchNotifications, userID: USER.id,
                                alertMessage: `${stream._data.user_name} is live at: https://www.twitch.tv/${stream._data.user_name.split(' ').join('').trim()}`
                            });
                        }
                    }
                })
            promiseArray.push(twitchByChannel);
        }
    }
    await Promise.all(promiseArray);

    for (entry of sendArray) {
        for (let GUILD of MAIN.Client.guilds.cache.values()) {


            let guild = await GUILD.fetch();

            let member = guild.members.cache.get(entry.userID);
            if (!member) continue;
            //  console.log("Trying to alert")
            member.send(entry.alertMessage);
            User.findOneAndUpdate({ id: entry.userID }, { $set: { twitchNotifications: entry.twitchNotifications } }, function (err, doc, res) { if (err) console.log(err) });
            break;
        }
    }
    return 1;
}
exports.checkUsersTwitchStreams = checkUsersTwitchStreams;


//params = [streamer, channelTwitch, channelID] -> Guild.channelTwitch
async function linkChannelWithTwitch(params, socket) {

    let streamer = await getTwitchChannel(params[0])
        .catch((err) => { console.log("caught error in linkChannelWithTwitch") });

    if (!streamer) return { status: -1 };

    for (channel of params[1]) {
        if (channel[1] == params[2]) {
            if (channel[0] == streamer._data.id) {
                return { status: -2 };
            }
        }
    }
    params[1].push([streamer._data.id, params[2]])
    return { channelTwitch: params[1] };
}
exports.linkChannelWithTwitch = linkChannelWithTwitch;

//params = [streamer, twitchFollows]
async function linkTwitch(params, socket) {

    let args = params[0];

    let streamer = await getTwitchChannel(args.trim());
    if (!streamer) return { status: -1 };

    let follows = await streamer.getFollows();
    let followIDs = [];
    if (follows)
        for (chan of follows.data)
            followIDs.push(chan._data.to_id);

    let goodArray = [];

    for (channy of followIDs) {
        let tester = await getTwitchChannelByID(channy);

        if (tester)
            goodArray.push(channy)
    }

    if (goodArray.length > 0)
        return { goodArray: goodArray, streamer: streamer };
    return { streamer: streamer };
}
exports.linkTwitch = linkTwitch;

//params = [streamer]
async function removeChannelTwitchLink(params, socket) {

    let streamer = await getTwitchChannel(params[0]).catch((err) => { console.log("caught error in removeChannelTwitchLink"); })
    if (!streamer) return { status: -1 };
    else return { streamer: streamer };
}
exports.removeChannelTwitchLink = removeChannelTwitchLink;

//params = [channelTwitch] ->Guild.channelTwitch
async function showChannelTwitchLinks(params, socket) {

    let promiseArray = [];

    for (follow of params[0])
        promiseArray.push(getTwitchChannelByID(follow[0]));

    return { promiseArray: await Promise.all(promiseArray) };
}
exports.showChannelTwitchLinks = showChannelTwitchLinks;

//params = [twitchFollows]
async function viewTwitchFollows(params, socket) {

    let promiseArray = [];

    for (follow of params[0])
        promiseArray.push(getTwitchChannelByID(follow));

    let finishedPromises = await Promise.all(promiseArray);
    finishedPromises.sort((a, b) => { return b._data.view_count - a._data.view_count });
    let finalArray = [];
    let online = [];
    let offline = [];

    for (promisy of finishedPromises) {

        let streamy = await isStreamLive(promisy._data.id);
        if (streamy)
            online.push({ name: 'Online', value: `<${promisy._data.display_name} is currently live with= ${streamy._data.viewer_count} Viewers!>\n`, viewers: streamy._data.viewer_count });
        else
            offline.push({ name: 'Offline', value: `<${promisy._data.display_name} - Total Views=${promisy._data.view_count}>\n`, viewers: promisy._data.view_count });
    }

    online.sort((a, b) => b.viewers - (a.viewers));
    offline.sort((a, b) => b.viewers - (a.viewers));

    finalArray = online.concat(offline);
    return { finalArray: finalArray };
}
exports.viewTwitchFollows = viewTwitchFollows;

//params = [channeltoUnfollow, twitchFollows, skipValidation]
async function unfollowTwitchChannel(params, socket) {

    let args = params[0];

    if (params.length == 2) {

        let promiseArray = [];

        for (follow of params[1])
            promiseArray.push(getTwitchChannelByID(follow));

        let finishedPromises = await Promise.all(promiseArray);

        let found = finishedPromises.find(element => element._data.display_name == args);

        let channelNames = [];
        let internalArray = [];

        for (channel of finishedPromises) {
            channelNames.push(channel._data.display_name);
            internalArray.push({ looped: true, channel: channel.id, name: channel._data.display_name });
        }
        if (!found) {
            return { channelNames: channelNames, internalArray: internalArray };
        }
        else {

            params[1].splice(params[1].indexOf(found._data.id), 1);
            return { twitchFollows: params[1], name: args };
        }
    }
    else {
        params[1].splice(params[1].indexOf(args), 1);

        return { twitchFollows: params[1], name: (await getTwitchChannelByID(args))._data.display_name };
    }
}
exports.unfollowTwitchChannel = unfollowTwitchChannel;

//params = [channel to follow, twitchFollows, linkedTwitch]
async function followTwitchChannel(params, socket) {

    let args = params[0];

    let targetChannel = await getTwitchChannel(args);
    if (!targetChannel) return { status: -1 };


    if (params[1].includes(targetChannel._data.id)) return { status: -2 };
    if (params[2] == (targetChannel._data.id)) return { status: -3 };

    params[1].push(targetChannel._data.id);
    return { result: params[1], targetChannelName: targetChannel._data.display_name };
}
exports.followTwitchChannel = followTwitchChannel;

async function isStreamLive(id) {
    return await twitchClient.helix.streams.getStreamByUserId(id);
}

async function getTwitchChannel(streamer) {
    try {
        const user = await twitchClient.helix.users.getUserByName(streamer.split(' ').join('').trim());
        return user;
    }
    catch (err) {
        console.log(err);
        console.log("Caught error getting a twitch channel");
        return null;
    }
}

async function getTwitchChannelByID(id) {
    const user = await twitchClient.helix.users.getUserById(id);
    return user;
}
exports.getTwitchChannelByID = getTwitchChannelByID;