const getYoutubeChannelId = require('get-youtube-channel-id');
const ytch = require('yt-channel-info');
const MAIN = require('../scraper.js');
const fs = require('fs');
const User = require('../User.js');
const Guild = require('../Guild.js');
const BOT = require('../Bot.js');


var alertCache = new Map();


const alertYoutube = async function (params) {

 //  return 1;
    let userArray = [];
    let guildArray = [];
    let promiseArray = [];
    let bot = await BOT.findOne();

    for (youtuber of bot.youtubeIDs) {
        // console.log(youtuber);
        let combo = youtuber;
        let youtuberID = youtuber[0];

        /**
         * youtuber = ['channelID', {
         *                              guilds: {'guildID': true/false}, 
         *                              users: {'userID': true/false}
         *                           }
         *            ]
         */


        let legitYoutuber = ytch.getChannelInfo(youtuberID)
            .then(async (youtubeObj) => {

                // console.log(youtubeObj.authorUrl)

                let vids = await ytch.getChannelVideos(youtuberID);
                let vidID = vids.items[0].videoId;
                //  console.log(vids.items[0].videoId)

                if (vids.items[0].premiere)
                    return 1;

                if (!vidID)
                    return 1;

                if (!alertCache.get(youtuberID)) {

                    let overallLimit = 10;
                    
                    let limit = vids.items.length > overallLimit ? overallLimit : vids.items.length;
                    let vidArr = [];
                    for (let i = 0; i < limit; i++) {

                        if (!vids.items[i].premiere)
                            vidArr.push(vids.items[i].videoId)
                    }

                    alertCache.set(youtuberID, vidArr)
                }

                else
                    if (alertCache.get(youtuberID).includes(vidID))
                        return 1;

                alertCache.get(youtuberID).push(vidID)

                for (guild of Object.entries(combo[1].guilds)) {

                    guildArray.push({ guildID: guild[0], youtuberID: youtubeObj.authorId, vidID: vidID, message: `${youtubeObj.author} just posted a new video! https://www.youtube.com/watch?v=${vids.items[0].videoId}` })
                }
                for (user of Object.entries(combo[1].users)) {

                    userArray.push({ userID: user[0], youtuberID: youtubeObj.authorId, vidID: vidID, message: `${youtubeObj.author} just posted a new video! https://www.youtube.com/watch?v=${vids.items[0].videoId}` })
                }

            });
        promiseArray.push(legitYoutuber);
        await new Promise(r => setTimeout(r, 20));
    }

    await Promise.all(promiseArray);


    if ((userArray.length == 0) && (guildArray == 0))
        return 1;

    let guilds = new Map();
    let users = new Map();

    let clientGuilds = await MAIN.Client.guilds.cache;
    let guildToUpdate = new Map();
    let userToUpdate = new Map();

    for (let guild of clientGuilds.values()) {//Go through all the guilds in Client

        let legitGuild = await guild.fetch();//get the full info of the guild

        for (let i = 0; i < guildArray.length; i++) {//For every single guild to be notified

            if (guildArray[i].guildID == legitGuild.id) {//Check if the current guild is the one we need
                let dbGuild = guilds.get(legitGuild.id);
                if (!dbGuild) {
                    dbGuild = await Guild.findOne({ id: legitGuild.id });//Get db guild
                    guilds.set(dbGuild.id, dbGuild);
                }
                //Might not cache of guilds above since I'd only ever run across the same guild once...?

              //  console.log(`${guildArray[i].youtuberID} -- is who we wanted -- ${dbGuild.name} is where we at`)


                if(!dbGuild.name){

                    console.log('wow')
                    console.log(1)
                }

                console.log(dbGuild.youtubeAlerts)
                for (let pair of dbGuild.youtubeAlerts.get(guildArray[i].youtuberID)) {//For ever youtube/channel pair in the guildDB

                    if (pair[1] != guildArray[i].vidID) {//check the the pair hasnt already been notified of this song

                       if (dbGuild.youtubeHERE)
                           legitGuild.channels.cache.get(pair[0]).send('@here ' + guildArray[i].message);
                       else
                           legitGuild.channels.cache.get(pair[0]).send(guildArray[i].message);

                        pair[1] = guildArray[i].vidID;

                        if (!guildToUpdate.get(dbGuild.id))//Update these guilds after
                            guildToUpdate.set(dbGuild.id, dbGuild);

                        guildArray.splice(i, 1);
                        i--;
                    }
                }
            }
        }


        for (let i = 0; i < userArray.length; i++) {

            let members = await legitGuild.members.fetch();
            let member = members.get(userArray[i].userID);
            if (member) {

                let dbUser = users.get(member.id);
                if (!dbUser) {
                    dbUser = await User.findOne({ id: member.id });
                    users.set(member.id, dbUser);
                }

                if(!dbUser.youtubeAlerts){
                    console.log(`${dbUser.id} somehow slept through in youtube!`);
                    continue;
                }

                if (userArray[i].vidID != dbUser.youtubeAlerts.get(userArray[i].youtuberID)) {//check the the user hasnt already been notified of this song

                    member.user.send(userArray[i].message);
                    dbUser.youtubeAlerts.set(userArray[i].youtuberID, userArray[i].vidID);

                    if (!userToUpdate.get(dbUser.id)) {
                        userToUpdate.set(dbUser.id, dbUser);
                    }

                    userArray.splice(i, 1);
                    i--;
                }
            }
        }

        if ((userArray.length == 0) && (guildArray == 0))
            break;
    }

    for (let guild of guildToUpdate.entries()) {

        Guild.findOneAndUpdate({ id: guild[0] }, { $set: { youtubeAlerts: guild[1].youtubeAlerts } }).exec();
    }
    for (let user of userToUpdate.entries()) {

        //console.log(user);
        User.findOneAndUpdate({ id: user[0] }, { $set: { youtubeAlerts: user[1].youtubeAlerts } }).exec();
    }
}
exports.alertYoutube = alertYoutube;