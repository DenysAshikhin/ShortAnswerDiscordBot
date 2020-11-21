const express = require('express');
const router = express.Router();
const MAIN = require('../../scraper.js');
const {
    validateGuild
} = require('../modules/middleware.js');
const GUILDS = require('../../Guild.js');
const User = require('../../User.js');
const ytch = require('yt-channel-info');
const twitchLogic = require('../../serverLogic/twitchLogic.js');



router.get('/dashboard', function (req, res) {

    console.log('in /dashboard')

    res.render('dashboard/index', {
        something: "Null",
        subtitle: "Short Answer Bot Dasboard",
        admin: false
    });
    //res.send('Hello World')
});

router.get('/servers/:id', validateGuild, async function (req, res) {

    console.log('in /servers/:' + req.params.id)

    res.locals.guildPrefix = res.locals.guildPrefix == '-1' ? 'sa!' : res.locals.guildPrefix;
    res.locals.userPrefix = res.locals.userPrefix == '-1' ? 'sa!' : res.locals.userPrefix;


    let promiseArr = [User.find({ "guilds": res.locals.guild.id, [`reps.${res.locals.guild.id}`]: { $ne: null } }).lean()];

    //console.log(res.locals.dbGuild.blacklistedRepRoles.length)


    if (res.locals.dbGuild.youtubeAlerts.size > 0) {

        let youtubeArr = [];

        for (const [key, value] of res.locals.dbGuild.youtubeAlerts)
            youtubeArr.push(ytch.getChannelInfo(key));

        promiseArr.push(Promise.allSettled(youtubeArr));
    }
    else
        promiseArr.push(MAIN.sleep(1));

    let twitchMap = new Map();


    if (res.locals.dbGuild.channelTwitch.length > 0) {

        let twitchArr = [];

        for (const [twitchID, channelID] of res.locals.dbGuild.channelTwitch) {

            // console.log(twitchID)
            // console.log(channelID)

            let twitchy = twitchMap.get(twitchID);

            if (!twitchy)
                twitchy = [channelID];
            else
                twitchy.push(channelID);
            twitchMap.set(twitchID, [channelID]);

            twitchArr.push(twitchLogic.getTwitchChannelByID(twitchID));
            //console.log(temp._data.display_name);
        }

        promiseArr.push(Promise.allSettled(twitchArr));
    }
    else
        promiseArr.push(MAIN.sleep(1));



    //[dbUsers, Youtubes, Twitch]
    let finishedPromises = await Promise.allSettled(promiseArr);



    let dbUsers = finishedPromises[0].value;

    let youtubePairs = [];

    if (res.locals.dbGuild.youtubeAlerts.size > 0)
        for (const youtube of finishedPromises[1].value) {

            // console.log(youtube.value.author);
            // console.log(res.locals.dbGuild.youtubeAlerts.get(youtube.value.authorId));

            for (const channels of res.locals.dbGuild.youtubeAlerts.get(youtube.value.authorId)) {
                //console.log(channels[0])
                youtubePairs.push({
                    youtuber: youtube.value.author,
                    channel: MAIN.Client.channels.cache.get(
                        channels[0]
                    ).name
                })
            }
        }

    let twitchPairs = [];

    if (twitchMap.size > 0)
        for (const twitchy of finishedPromises[2].value) {
            for (const channel of twitchMap.get(twitchy.value._data.id)) {

                twitchPairs.push({
                    streamer: twitchy.value._data.display_name,
                    channel: MAIN.Client.channels.cache.get(
                        channel
                    ).name
                })
            }
        }


    let repArr = [];

    for (let dbUser of dbUsers) {

        if (dbUser.reps) {
            let rep = dbUser.reps[res.locals.guild.id];
            if (rep)
                if (rep != '0')
                    repArr.push({
                        memberID: dbUser.id,
                        rep: rep
                    });
        }
    }

    let roleArr = [];
    let memberArr = [];
    let memberMap = new Map();

    for (let role of res.locals.guild.roles.cache.values())
        roleArr.push({
            roleID: role.id,
            name: role.name
        });
    for (let member of res.locals.guild.members.cache.values()) {
        memberArr.push({
            memberID: member.id,
            memberDisplayName: member.displayName
        });
        memberMap.set(member.id, member.displayName)
    }


    res.render('dashboard/show', {
        something: "Null",
        subtitle: "Short Answer Bot Dashboard",
        url: MAIN.REDIRECT_URL,
        key: res.cookies.get('key'),
        guild: res.locals.guild,
        roles: roleArr,
        members: memberArr,
        dbGuild: res.locals.dbGuild,
        admin: res.locals.admin,
        guildPrefix: res.locals.guildPrefix,
        userPrefix: res.locals.userPrefix,
        dbUser: res.locals.dbUser,
        rep: repArr,
        memberMap: memberMap,
        youtubeAlerts: youtubePairs,
        twitchAlerts: twitchPairs
    });

    //res.send('Hello World')
});

router.put('/servers/:id/:module', validateGuild, async function (req, res) {

    try {

        const {
            id,
            module
        } = req.params;


        console.log(`DIS BE: ${id}`)
        console.log(`ThOOOO: ${module}`)

        //const savedGuild = await guilds.get

        res.redirect(`/servers/${id}`)

    } catch (err) {

        res.render('errors/400');
    }

});


module.exports = router;