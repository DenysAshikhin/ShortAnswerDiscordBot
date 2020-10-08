const { mem } = require('node-os-utils');
const MAIN = require('./short-answer.js');

async function topStats(message) {
    //create a stats channel to display peoples stats, top messages, loud mouth, ghost (AKF), MIA (longest not seen)
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");


    let parsed = await MAIN.sendToServer({ command: 'topStats', params: [message.guild.id, message.channel.id] });
    return 1;
}
exports.topStats = topStats;

const botStats = async function (message, params, user) {

    let guilds = MAIN.Client.guilds.cache;
    let userCount = 0;
    let memberMap = new Map();

    for (let guild of guilds.values()) {



        let members = await guild.members.fetch();

        for (let member of members.values()) {

            if (!member.user.bot) {
                if (!memberMap.get(member.id))
                    memberMap.set(member.id, true)
            }
        }

        userCount += members.size;
    }


    message.channel.send(`Command currently under construction, here is a temporary print: ${memberMap.size} unique users across ${guilds.size} servers with ${MAIN.commandMap.size} unique commands!`);


    console.log(userCount, guilds.size, MAIN.commandMap.size);
}
exports.botStats = botStats;

async function specificStats(message) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");
    if (message.mentions.members.size < 1)
        message.channel.send("You have to @someone properly!");
    else if (message.mentions.members.first().id == MAIN.botID)
        message.channel.send("My stats are private!");
    else {

        let specificEmbed = await getStats(message.mentions.members.first());
        specificEmbed.description = message.mentions.members.first().displayName + ", *" + message.member.displayName + "* requested your stats:";
        specificEmbed.thumbnail.url = message.mentions.users.first().avatarURL();

        message.channel.send({ embed: specificEmbed });
    }
}
exports.specificStats = specificStats;

async function getStats(member, user) {

    if (!user)
        user = await MAIN.findUser(member);

    let index = user.guilds.indexOf(member.guild.id);

    if (!user.kicked[index]) {

        let statsEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        statsEmbed.date = new Date();
        statsEmbed.fields = [
            { name: "** **", value: "```md\n" + `Tracked since:\n#${user.dateJoined[index]}` + "```", inline: true },
            { name: "** **", value: "```md\n" + `Total number of messages sent:\n#${user.messages[index]}\n\n` + `Last message sent:\n#${user.lastMessage[index]}` + "```", inline: true },
            {
                name: "** **", value: "```md\n" + `Last time you talked was:\n#${user.lastTalked[index]}\n\n` + `Total time spent talking (in minutes):\n#${user.timeTalked[index]}\n\n`
                    + `Time spent AFK (in minutes):\n#${user.timeAFK[index]}` + "```", inline: true
            },
            {
                name: "** **", value: "```md\n" + `Number of games you are signed up for:\n#${user.games.length}\n\n` + `Number of saved playlists:\n#${user.playlists.length}` + "```",
                inline: true
            },
            {
                name: "** **", value: "```md\n" + `Whether you are excluded from pings:\n#${user.excludePing}\n\n` + `Whether you are excluded from DMs:\n#${user.excludeDM}` + "```",
                inline: true
            },
            { name: "** **", value: "```md\n" + `Number of succesful summons:\n#${user.summoner[index]}` + "```", inline: true }
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
        statResult.thumbnail.url = message.author.avatarURL();
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
                    { name: "Tracked since: ", value: user.dateJoined[i], inline: false },
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