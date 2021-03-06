const MAIN = require('../scraper.js');
const User = require('../User.js');
const Guild = require('../Guild.js');



/** 
 * @params = [guildID, channelID, amount]
 */
const topRep = async function (params) {

    let finalArr = [];

    let guild = await MAIN.Client.guilds.fetch(params[0]);
    let channel = guild.channels.cache.get(params[1]);

    let messy = await channel.send("Fetching all of the rep scores.... 0% complete!");

    let users = await User.find({ "guilds": params[0], [`reps.${params[0]}`]: { $ne: null } }).lean();

    if (users.length == 0 )
        messy.edit("No on in this server has a non-zero rep amount!");

    let members = await guild.members.fetch();

    let count = 0;
    let updated = 1;
    let step = 0.25;

    for (let user of users) {

        count++;

        if ((count / users.length) > (updated * step)) {
            await messy.edit("Fetching all of the rep scores...." + ` ${(updated * (step)) * 100}% complete!`);
            updated++;
        }

        let repy = await changeRep(user, guild.id, 0, {
            channel: channel
        });

        try {
            members.get(user.id).displayName
        } catch (err) {
            continue;
        }

        finalArr.push({

            displayName: members.get(user.id).displayName,
            rep: repy
        });
    }

    finalArr = finalArr.filter(function (value) {
        return value.rep > 0
    });
    finalArr.sort(function (a, b) {
        return b.rep - a.rep
    });

    let finalString = finalArr.reduce(function (acc, current, index) {
        // acc.push({ value: `${index + 1}) ${current.displayName} has ${current.rep} rep` });
        acc.push({
            value: `${current.displayName} has ${current.rep} rep`
        });
        return acc;
    }, []);


    if (!finalString) {
        channel.send("No one in this server has above 0 rep!");
        return {
            status: 1
        };
    }

    let originalLength = finalString.length;

    let limit = params[2];

    if (limit > finalString.length)
        limit = finalString.length;


    finalString.length = limit;
    await messy.edit("Fetching all of the rep scores...." + ` ${100}% complete!`);

    MAIN.prettyEmbed({
        guildID: guild.id,
        channelID: channel.id
    }, finalString, {
        modifier: 'xl',
        title: `Below are the top ${limit} rep'ed users of ${originalLength} who have > 0 rep!`
    });
    return {
        status: 1
    };
}
exports.topRep = topRep;


/**
 * 
 * @param {[guildID], [channelID], [ratio]} params 
 */
const repToFaction = async function (params) {

    let guild = await MAIN.Client.guilds.fetch(params[0]);
    let channel = guild.channels.cache.get(params[1]);

    let messy = await channel.send("Fetching all of the rep scores.... 0% complete!");

    let users = await User.find({
        guilds: guild.id
    }).lean();

    let dbGuild = await Guild.findOne({
        id: params[0]
    });

    let members = await guild.members.fetch();

    let count = 0;
    let updated = 1;
    let step = 0.25;

    for (let user of users) {

        count++;

        if ((count / users.length) > (updated * step)) {
            await messy.edit("Converting all of the rep scores...." + ` ${(updated * (step)) * 100}% complete!`);
            updated++;
        }

        let repy = await changeRep(user, guild.id, 0, {
            channel: channel
        }, true);

        try {
            members.get(user.id).displayName
        } catch (err) {
            continue;
        }

        if (repy != 0) {

            repy *= params[2];

            let memberRoles = guild.members.cache.get(user.id).roles.cache.keyArray();

            let factionModify = dbGuild.factions.findIndex(element => memberRoles.includes(element.role));
            if (factionModify == -1)
                continue;

            //wtf about the persons personal points??
            dbGuild.factions[factionModify].points += repy;
            //dbGuild.factions[factionModify].contributions.general += repy;

            let specificUser = dbGuild.factions[factionModify].contributions.members;
            specificUser = dbGuild.factions[factionModify].contributions.members.find(element => element.userID == user.id);
            if (specificUser) //might need cleaning up at some point but w/e
                specificUser.points += repy;
            else {

                dbGuild.factions[factionModify].contributions.members.push({
                    userID: user.id,
                    points: repy
                });
            }
        }
    }


    Guild.findOneAndUpdate({
        id: dbGuild.id
    }, {
        $set: {
            factions: dbGuild.factions
        }
    }, function (err, doc, res) { });


    await messy.edit("Converting all of the rep scores...." + ` ${100}% complete!\nEveryone's rep scores have been reset to 0 and their respective factions (if applicable)` +
        ` got the appropriate amount of points!`);

    return {
        status: 1
    };
}
exports.repToFaction = repToFaction;



const changeRep = async function (user, guildID, amount, message, resetPoints) {

    let dbGuild = await MAIN.findGuild({
        id: guildID
    });
    // console.log(dbGuild)
    let actualGuild = MAIN.Client.guilds.cache.get(guildID);

    let guildMember = actualGuild.members.cache.get(user.id);

    if (amount > 0) {

        for (let roleID of dbGuild.blacklistedRepRoles) {

            if (guildMember.roles.cache.keyArray().includes(roleID)) {
                channel.send(`${MAIN.mention(guildMember.id)} is blacklisted from receiving rep!`);
                throw ('Blacklisted boi')
                return -1;
            }
        }
    }

    let repExisted = true;

    if (!user.reps) {


        repExisted = false;

        user.reps = new Map();

        user.reps.set(guildID, Number(amount));

        //   checkRepThreshold(user.id, Number(amount), dbGuild, actualGuild);

        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();
        return user.reps.get(guildID);
    }


    let rep;

    if (repExisted) {
        user.reps = new Map(Object.entries(user.reps));
        rep = user.reps.get(guildID);
    }
    else {
        rep = 0;
    }

    if (!rep) {


        user.reps.set(guildID, Number(amount));

        //checkRepThreshold(user.id, Number(amount), dbGuild, actualGuild);

        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();
        return user.reps.get(guildID);
    }

    if (amount != 0) {

        user.reps.set(guildID, Number(rep) + Number(amount));

        //checkRepThreshold(user.id, Number(rep) + Number(amount), dbGuild, actualGuild);
        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();
    } else if (resetPoints) {

        let oldRep = user.reps.get(guildID);

        user.reps.set(guildID, 0);

        //checkRepThreshold(user.id, Number(rep) + Number(amount), dbGuild, actualGuild);
        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();

        return oldRep;
    }
    return user.reps.get(guildID);
}
exports.changeRep = changeRep;

/** 
 * @params = [guildID, channelID]
 */
async function topStats(params) {


    let guild = await MAIN.Client.guilds.fetch(params[0]);
    let channel = guild.channels.cache.get(params[1]);

    channel.send("Collecting all the stats....");
    let allUsers = await User.find({
        guilds: guild.id
    }).lean();

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
            if (user.id == MAIN.Client.user.id)
                continue;

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

                let userDate = MAIN.findFurthestDate(user.lastMessage[userIndex], user.lastTalked[userIndex]);
                let MIADate = MAIN.findFurthestDate(MIA.lastMessage[MIAIndex], MIA.lastTalked[MIAIndex]);

                if (userDate == MAIN.findFurthestDate(userDate, MIADate) && userDate != "0-0-0") {
                    MIA = user;
                    MIAIndex = userIndex;
                } else if (MIADate == "0-0-0" && userDate != "0-0-0") {
                    MIA = user;
                    MIAIndex = userIndex;
                }
            }
        }
    }

    let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    statsEmbed.date = new Date();
    statsEmbed.title = MAIN.Embed.title + ` - Top Stats for ${guild.name}!`;
    statsEmbed.thumbnail.url = guild.iconURL();
    let members = await guild.members.fetch();
    statsEmbed.fields = [{
        name: '** **',
        value: "```md\n" + `The Silent Type:\n#${members.get(silentType.id).displayName}\n` + `<${silentType.messages[silentTypeIndex]} messages sent.>` + "```"
    },
    {
        name: '** **',
        value: "```md\n" + `The Loud Mouth:\n#${members.get(loudMouth.id).displayName}\n` + `<${loudMouth.timeTalked[loudMouthIndex]} minutes spent talking.>` + "```"
    },
    {
        name: '** **',
        value: "```md\n" + `The Ghost:\n#${members.get(ghost.id).displayName}\n` + `<${ghost.timeAFK[ghostIndex]} minutes spent AFK.>` + "```"
    },
    {
        name: '** **',
        value: "```md\n" + `The MIA:\n#${members.get(MIA.id).displayName}\n` + `<${MAIN.findFurthestDate(MIA.lastTalked[MIAIndex], MIA.lastMessage[MIAIndex])} last seen date.>` + "```"
    },
    {
        name: '** **',
        value: "```md\n" + `The Summoner:\n#${members.get(summoner.id).displayName}\n` + `<${summoner.summoner[summonerIndex]} summoning rituals completed.>` + "```"
    }
    ];

    channel.send({
        embed: statsEmbed
    });

    return {
        status: 1,
        result: statsEmbed
    };
}
exports.topStats = topStats;