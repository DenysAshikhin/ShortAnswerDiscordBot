const MAIN = require('./short-answer.js');




async function topStats(message) {
    //create a stats channel to display peoples stats, top messages, loud mouth, ghost (AKF), MIA (longest not seen)
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    let allUsers = await MAIN.getUsers();
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

                let userDate = MAIN.findFurthestDate(user.lastMessage[userIndex], user.lastTalked[userIndex]);
                let MIADate = MAIN.findFurthestDate(MIA.lastMessage[MIAIndex], MIA.lastTalked[MIAIndex]);

                if (userDate == MAIN.findFurthestDate(userDate, MIADate) && userDate != "0-0-0") {
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


    let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    statsEmbed.date = new Date();
    statsEmbed.title = MAIN.Embed.title + ` - Top Stats for ${message.guild.name}!`;
    statsEmbed.thumbnail.url = message.guild.iconURL();
    statsEmbed.fields = [
        { name: `The Silent Type: ${silentType.displayName}`, value: `${silentType.messages[silentTypeIndex]} messages sent.` },
        { name: `The Loud Mouth: ${loudMouth.displayName}`, value: `${loudMouth.timeTalked[loudMouthIndex]} minutes spent talking.` },
        { name: `The Ghost: ${ghost.displayName}`, value: `${ghost.timeAFK[ghostIndex]} minutes spent AFK.` },
        { name: `The MIA: ${MIA.displayName}`, value: MAIN.findFurthestDate(MIA.lastTalked[MIAIndex], MIA.lastMessage[MIAIndex]) + " last seen date." },
        { name: `The Summoner: ${summoner.displayName}`, value: `${summoner.summoner[summonerIndex]} summoning rituals completed.` }
    ];


    message.channel.send({ embed: statsEmbed });
}
exports.topStats = topStats;

async function specificStats(message) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    if (message.mentions.members.size < 1)
        message.channel.send("You have to @someone properly!");
    else if (message.mentions.members.first().id == MAIN.botID)
        message.channel.send("My stats are private!");
    else {

        let specificEmbed = await getStats(message.mentions.members.first());
        specificEmbed.description = message.mentions.members.first().displayName + ", *" + message.member.displayName + "* requested your stats:";
        specificEmbed.thumbnail.url = message.mentions.members.first().user.avatarURL();

        message.channel.send({ embed: specificEmbed });
    }
}
exports.specificStats = specificStats;

async function getStats(member, user) {

    if (!user)
        user = await MAIN.findUser({ id: member.id });

    let index = user.guilds.indexOf(member.guild.id);

    if (!user.kicked[index]) {
        let stats = "";


        let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        statsEmbed.date = new Date();
        statsEmbed.fields = [
            { name: "Total number of messages sent: ", value: user.messages[index], inline: true },
            { name: "Last message sent: ", value: user.lastMessage[index], inline: true },
            { name: "Total time spent talking (in minutes): ", value: user.timeTalked[index], inline: true },
            { name: "Last time you talked was: ", value: user.lastTalked[index], inline: true },
            { name: "Number of games you are signed up for: ", value: user.games.length, inline: true },
            { name: "Number of saved playlists: ", value: user.playlists.length, inline: true },
            { name: "Time spent AFK (in minutes): ", value: user.timeAFK[index], inline: true },
            { name: "You joined this server on: ", value: user.dateJoined[index], inline: true },
            { name: "Whether you are excluded from pings: ", value: user.excludePing, inline: true },
            { name: "Whether you are excluded from DMs: ", value: user.excludeDM, inline: true },
            { name: "Number of succesful summons: ", value: user.summoner[index], inline: true },
        ];

        return statsEmbed;
    }
    return -1;
}
exports.getStats = getStats;

async function personalStats(message, params, user) {

    if (message.channel.type != 'dm') {
        let statResult = await getStats(message.member, user);
        statResult.title = MAIN.Embed.title + ` ${message.member.displayName}'s stats:`
        if (!user.kicked[user.guilds.indexOf(message.guild.id)]) {
            message.channel.send({ embed: statResult });
        }
    }
    else {


        let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        statsEmbed.date = new Date();
        statsEmbed.description = ` ${message.author.username} Here Are Your General Stats!`;
        statsEmbed.fields = [
            { name: "The games you are signed up for: ", value: user.games },
            { name: "Whether you are excluded from pings: ", value: user.excludePing },
            { name: "Whether you are excluded from DMs: ", value: user.excludeDM }
        ];

        message.channel.send({ embed: statsEmbed });

        for (let i = 0; i < user.guilds.length; i++) {

            if (!user.kicked[i]) {
                let stats = "";

                let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
                statsEmbed.date = new Date();
                statsEmbed.description = `Here Are Your Stats For ${message.client.guilds.cache.get(user.guilds[i]).name} Server!`;
                statsEmbed.thumbnail.url = message.client.guilds.cache.get(user.guilds[i]).iconURL();
                statsEmbed.fields = [
                    { name: "Total number of messages sent: ", value: user.messages[i], inline: false },
                    { name: "Last message sent: ", value: user.lastMessage[i], inline: false },
                    { name: "Total time spent talking (in minutes): ", value: user.timeTalked[i], inline: false },
                    { name: "Last time you talked was: ", value: user.lastTalked[i], inline: false },
                    { name: "Time spent AFK (in minutes): ", value: user.timeAFK[i], inline: false },
                    { name: "You joined this server on: ", value: user.dateJoined[i], inline: false },
                    { name: "Number of succesful summons: ", value: user.summoner[i], inline: false },
                ];

                message.channel.send({ embed: statsEmbed });
            }
        }
    }
}
exports.personalStats = personalStats;

async function guildStats(message, params, user) {

    if (message.channel.type == 'dm') return -1;

    if (!message.channel.permissionsFor(message.member).has("ADMINISTRATOR"))
        return message.channel.send("You do not have the administrator permission to view all member stats!")

    let memberArray = message.guild.members.cache.array();

    for (let i = 0; i < memberArray.length; i++) {

        if (memberArray[i].id != MAIN.botID) {
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
exports.guildStats = guildStats;