var gameJSON = require('./gameslist.json');
const MAIN = require('./short-answer.js');
const Fuse = require('fuse.js');
const User = require('./User.js');
//const Commands = require('./commands.json');


var games = new Array();
exports.games = games;
var guildSquads = new Map();


const updateGamesList = function () {

    let gameJSON = require('./gameslist.json')

    for (let element of gamyJson)
        games.push(element.name);
    games.sort();
    exports.games = games;
}
exports.updateGamesList = updateGamesList;

updateGamesList();

async function setControlEmoji(message) {
    try {
        await message.react(MAIN.getEmojiObject('queue'));
        await message.react(MAIN.getEmojiObject('dequeue'));
        await message.react('🕒');
        await message.react('🕕');
        await message.react('🕘');
        await message.react('🚷');

    }
    catch (err) {
        console.log("CAUGHT ER")
        return -1;
    }
}

// async function setEmojiCollector() {
//     for (let messy of commandTracker.values()) {
//         messy.collector.resetTimer();
//     }
// }
//setInterval(refreshEmojiControls, 20 * 1000);
async function setEmojiCollector(message) {

    let collector = await message.createReactionCollector(function (reaction, user) {
        return (((reaction.emoji == MAIN.getEmojiObject('queue')) || (reaction.emoji == MAIN.getEmojiObject('dequeue')) ||
            (reaction.emoji.name === '🕒') || (reaction.emoji.name === '🕕') || (reaction.emoji.name === '🕘')
            || (reaction.emoji.name === '🕛') || (reaction.emoji.name === '🚷') && (user.id != message.author.id)) && (!user.bot))
    }, { time: 29 * 60 * 1000 });
    collector.on('collect', async function (emoji, user) {

        if (emoji.emoji == MAIN.getEmojiObject('queue')) {

            let result = await Queue(emoji.message, null, user, { displayName: user.username, id: user.id });
            if (result)
                emoji.users.remove(user);
            if (result == -1)
                return MAIN.selfDestructMessage(message, "You're already a part of this summon!", 3, emoji);
            else if (result == -2)
                return MAIN.selfDestructMessage(message, "There is no more room in the summon!", 3, emoji);

            await resetSummonRitual(message, user.id, null, true);
        }
        else if (emoji.emoji == MAIN.getEmojiObject('dequeue')) {

            let result = await deQueue(emoji.message, null, user, { id: user.id, displayName: user.username });

            switch (result) {
                case -1:
                    MAIN.selfDestructMessage(emoji.message, "You have to join this summon before leaving it!", 3, emoji);
                    emoji.users.remove(user);
                    break;
                case 1:
                    emoji.message.channel.send("You have disbanded your summon!");
                    // resetSummonRitual(message, user.id);
                    break;
                case 2:
                    MAIN.selfDestructMessage(emoji.message, "You have left the summon!", 3, emoji);
                    await resetSummonRitual(message, user.id, null, false);
                    break;
            }
        }
        else if ((emoji.emoji.toString() == '🕒')) {
            let result = await Queue(emoji.message, null, user, { displayName: user.username, id: user.id });
            if (result)
                emoji.users.remove(user);
            if (result == -1)
                return MAIN.selfDestructMessage(message, "You're already a part of this summon!", 3, emoji);
            else if (result == -2)
                return MAIN.selfDestructMessage(message, "There is no more room in the summon!", 3, emoji);
            await resetSummonRitual(message, user.id, 15, true);
        }
        else if ((emoji.emoji.toString() == '🕕')) {
            let result = await Queue(emoji.message, null, user, { displayName: user.username, id: user.id });
            if (result)
                emoji.users.remove(user);
            if (result == -1)
                return MAIN.selfDestructMessage(message, "You're already a part of this summon!", 3, emoji);
            else if (result == -2)
                return MAIN.selfDestructMessage(message, "There is no more room in the summon!", 3, emoji);
            await resetSummonRitual(message, user.id, 30, true);
        }
        else if ((emoji.emoji.toString() == '🕘')) {
            let result = await Queue(emoji.message, null, user, { displayName: user.username, id: user.id });
            if (result)
                emoji.users.remove(user);
            if (result == -1)
                return MAIN.selfDestructMessage(message, "You're already a part of this summon!", 3, emoji);
            else if (result == -2)
                return MAIN.selfDestructMessage(message, "There is no more room in the summon!", 3, emoji);
            await resetSummonRitual(message, user.id, 45, true);
        }
        else if ((emoji.emoji.toString() == '🕛')) {
            let result = await Queue(emoji.message, null, user, { displayName: user.username, id: user.id });
            if (result)
                emoji.users.remove(user);
            if (result == -1)
                return MAIN.selfDestructMessage(message, "You're already a part of this summon!", 3, emoji);
            else if (result == -2)
                return MAIN.selfDestructMessage(message, "There is no more room in the summon!", 3, emoji);

            await resetSummonRitual(message, user.id, 60, true);
        }
        else if ((emoji.emoji.toString() == '🚷')) {
            let result = await banish(emoji.message, { player: false }, user, { id: user.id, displayName: user.username });
            if (result == -1)
                emoji.users.remove(user);
        }
    });
    return collector;
}

const resetSummonRitual = async function (message, summonerID, time, queue) {

    let squads = guildSquads.get(message.guild.id);

    for (let squad of squads.values()) {

        if (squad.messageID == message.id) {

            let lastMessage = await message.channel.messages.fetch({ limit: 1 });
            lastMessage = lastMessage.first();
            let defaultDesc = squad.message.embeds[0].description
            //.substring(0,squad.message.embeds[0].description.indexOf("!```") + 4);

            {
                let summonMessage = await MAIN.prettyEmbed(message,
                    [{
                        name: `${message.guild.members.cache.get(squad.summonerID).displayName}'s Summon: ${squad.joinedIDS.length}/${squad.size}`,
                        value: squad.displayNames.reduce((acc, current, index) => {
                            acc.push(`${index + 1}) ${current}`);
                            return acc;
                        }, [])
                    }], { description: defaultDesc, modifier: 1 });


                // await MAIN.prettyEmbed(message, defaultDesc,
                //     [{
                //         name: `${message.guild.members.cache.get(squad.summonerID).displayName}'s Summon: ${squad.joinedIDS.length}/${squad.size}`,
                //         value: squad.displayNames.reduce((acc, current, index) => {
                //             acc.push(`${index + 1}) ${current}`);
                //             return acc;
                //         }, [])
                //     }], -1, -1, 1,
                //     null, null, null, 1);




                if (queue) {
                    if (time)
                        message.channel.send(MAIN.mention(summonerID) + ` is joining in ${time} minutes!`);
                    else
                        message.channel.send(MAIN.mention(summonerID) + ` has joined!`);
                }
                else {
                    message.channel.send(MAIN.mention(summonerID) + ` has left!`);

                }

                squad.collector.stop();
                squad.messageID = summonMessage.id;

                squad.collector = await setEmojiCollector(summonMessage).catch((err) => { console.log("IGNORING OTHER ERROR") })

                await setControlEmoji(summonMessage);
                await squad.message.delete();
                squad.message = summonMessage;
            }
            return 1;
        }
    }
}

//move this to backup if needed
async function pingUsers(message, game, user) {//Return 0 if it was inside a DM

    const args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send(`Pong! The time delay is ${message.author.client.ws.ping}ms`);

    if (message.channel.type == 'dm') {
        message.channel.send(message.author.username + " has summoned " + MAIN.mention(MAIN.botID) + " for some " + game
            + "\nUnfortunately I cannot play games, why not try the same command inside a server?");
        return 0;
    }
    else if (message.content == game) {
        message.channel.send("You have to provide an actual game to ping!");
        return -1;
    }

    let sizeLimit = message.content.split(',')[1];
    if (sizeLimit)
        sizeLimit.trim();
    let squadSize = !isNaN(sizeLimit) && sizeLimit.length > 0 ? Number(sizeLimit) : 5;
    squadSize = squadSize <= 0 ? 5 : squadSize;

    if (game.length > 1 && Array.isArray(game)) {
        game = game[0];
    }

    let check = checkGame(games, game, user);

    if (check == -1) {

        message.channel.send(`I couldn't find any match for ${game}! Try a different game?`);
        return check;
    }
    else if (check.result[0].score != 0) {

        let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);
        let tempArray = [];

        for (suggestion of prettyArray)
            tempArray.push(suggestion)

        //MAIN.prettyEmbed(message, `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`, tempArray, -1, -1, 1, null, null, true);

        MAIN.prettyEmbed(message, tempArray, {
            description: `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
            modifier: 1, selector: true
        });



        MAIN.specificCommandCreator(pingUsers, [message, -1, user], check.result, user);
        return -11;
    }
    else {

        game = check.result[0].item;
        let commonUsers = [];
        let signedUp = "";
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel)
            for (member of voiceChannel.members)
                commonUsers.push(member[0]);


        let users = await User.find({ games: game, guilds: message.guild.id });
        for (let user of users) {
            if (!user.kicked[user.guilds.indexOf(message.guild.id)] && (user.id != message.author.id)) {

                if ((user.excludePing == false) && !(commonUsers.includes(user.id)))
                    signedUp += MAIN.mention(user.id) + " ";
                else
                    signedUp += `**${message.guild.members.cache.get(user.id).displayName}** `;

                if ((user.excludeDM == false) && !(commonUsers.includes(user.id)))
                    MAIN.directMessage(message, user.id, game);
            }
        }

        if (signedUp.length > 3) {


            let summonMessage = await MAIN.prettyEmbed(message,
                [{
                    name: `${message.member.displayName}'s Summon: 1/${squadSize}`,
                    value: [user.displayName].reduce((acc, current, index) => {
                        acc.push(`${index + 1}) ${current}`);
                        return acc;
                    }, [])
                }], {
                description: message.member.displayName + " has summoned " + signedUp + " for some " + game
                    + "```fix\n" + `Use emojis to join! Or use the **q** command!` + "```", modifier: 1
            });

            // let summonMessage = await MAIN.prettyEmbed(message, message.member.displayName + " has summoned " + signedUp + " for some " + game
            // + "```fix\n" + `Use emojis to join! Or use the **q** command!` + "```",
            // [{
            //     name: `${message.member.displayName}'s Summon: 1/${squadSize}`,
            //     value: [user.displayName].reduce((acc, current, index) => {
            //         acc.push(`${index + 1}) ${current}`);
            //         return acc;
            //     }, [])
            // }], -1, -1, 1,
            // null, null, null, 1);

            setControlEmoji(summonMessage);
            let collector = await setEmojiCollector(summonMessage);


            let squads = guildSquads.get(message.guild.id);

            if (squads) {
                let squad = squads.find(element => element.summonerID == user.id);
                if (squad) {
                    squads.splice(squads.indexOf(squad), 1);
                    message.channel.send("Overwriting your old summon!");
                }
            }

            if (squads)
                squads.push({ joinedIDS: [user.id], message: summonMessage, collector: collector, messageID: summonMessage.id, game: game, displayNames: [user.displayName], size: squadSize, created: new Date(), summoner: user.displayName, summonerID: user.id });
            else
                guildSquads.set(message.guild.id, [{ joinedIDS: [user.id], message: summonMessage, collector: collector, messageID: summonMessage.id, game: game, displayNames: [user.displayName], size: squadSize, created: new Date(), summoner: user.displayName, summonerID: user.id }])


            {     // for (let i = 0; i < 25; i++) {

                //     let tempPlayers = [];

                //     for (let j = 0; j < 7; j++) {

                //         tempPlayers.push(`${user.displayName} ${i}-${j}`);
                //     }
                //     let squads = guildSquads.get(message.guild.id);
                //     squads.push({ game: game, displayNames: JSON.parse(JSON.stringify(tempPlayers)), size: squadSize, created: new Date(), summoner: user.displayName + i, summonerID: user.id });
                // }
            }
        }
        else
            message.channel.send("No one else has signed up for " + game + ".");
        let index = user.guilds.indexOf(message.guild.id);
        user.summoner[index] += 1;
        User.findOneAndUpdate({ id: user.id }, { $set: { summoner: user.summoner } }, function (err, doc, res) { });
        return 1;
    }
}
exports.pingUsers = pingUsers;

function checkGame(gameArray, params, user) {

    if (!isNaN(params)) {
        if (params < 0 || params >= gameArray.length) {
            return -1;
        }
        params = gameArray[Math.floor(params)];
    }
    else if (Array.isArray(params)) {
        params = params[0].trim();
    }
    else {
        params = params.trim();
    }

    let finalArray = new Array();
    let finalList = "";
    let newOptions = JSON.parse(JSON.stringify(MAIN.options));
    newOptions = {
        ...newOptions,
        minMatchCharLength: params.length / 2,
        findAllMatches: false,
        includeScore: true,
    }
    //
    let fuse = new Fuse(gameArray, newOptions);
    let result = fuse.search(params);
    let maxResults = 5;
    if (maxResults > result.length)
        maxResults = result.length;

    for (let i = 0; i < maxResults; i++) {

        finalList += (i + 1) + ") " + result[i].item + "\n";
        finalArray.push(result[i]);
    }

    let completeCheck = {
        result: finalArray,
        prettyList: finalList
    };

    if (finalArray.length > 0)
        return completeCheck;
    else return -1
}

function purgeGamesList(message, params, user) {

    User.findOneAndUpdate({ id: user.id },
        {
            $set: {
                games: []
            }
        }, function (err, doc, res) {
            //console.log(doc);
        });
    message.channel.send("You games list has been emptied!");
    return 1;
}
exports.purgeGamesList = purgeGamesList;

async function personalGames(message, params, user) {

    if (!user.games)
        user = await MAIN.findUser({ id: message.author.id })
    let display = message.author.username;
    if (message.member != null)
        display = message.member.displayName;

    if (user.games.length == 0) return message.channel.send("You haven't signed up for any games!");

    let gameArr = [];

    for (let i = 0; i < user.games.length; i++) {

        gameArr.push(`${user.games[i]}`);
    }

    //MAIN.prettyEmbed(message, display + " here are the games you are signed up for:", gameArr, -1, 1, 1);
    MAIN.prettyEmbed(message, gameArr, { description: display + " here are the games you are signed up for:", modifier: 1, startTally: 1 });

    if (games.length <= 0)
        message.channel.send("You are not signed up for any games.");

    return 1;
}
exports.personalGames = personalGames;

function search(message, searches) {

    if (searches == undefined || searches == null || searches.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + "search counter");
        return -1;
    }
    if (searches.length == 1 && (searches[0].toUpperCase() == (prefix.toUpperCase() + "SEARCH"))) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + "search counter");
        return -1;
    }

    let foundOne = false;

    for (let i = 0; i < searches.length; i++) {

        let query = searches[i];
        if (query.length > 0) {

            let fieldArray = new Array();

            let fuse = new Fuse(games, MAIN.options);
            let result = fuse.search(query);

            let maxResults = 26 < result.length ? 26 : result.length;

            for (let i = 0; i < maxResults; i++) {

                fieldArray.push(result[i].refIndex + ") " + result[i].item);
                foundOne = true;
            }
            if (result.length < 1)
                message.channel.send(`No matching games were found for: ${query}`)
            else
                MAIN.prettyEmbed(message, fieldArray, { description: `Here are the results for: ${query}`, modifier: 1 });
            //MAIN.prettyEmbed(message, `Here are the results for: ${query}`, fieldArray, -1, -1, 1);
        }

    }//for loop

    if (foundOne)
        if (Array.isArray(searches))
            return searches.length;
        else return 1;
    return 0;
}
exports.search = search;

function excludePing(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + "excludePing** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludePing: true } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " will be excluded from any further pings.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludePing: false } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " can now be pinged once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + "excludePing** *true/false*");
        return -1;
    }
}
exports.excludePing = excludePing;

function excludeDM(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + "excludeDM** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {
        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: true } }, function (err, doc, res) {
            if (err) {
                MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
            }
        });
        message.channel.send(MAIN.mention(message.author.id) + " will be excluded from any further DMs.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: false } }, function (err, doc, res) {
            if (err) {
                MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
            }
        });
        message.channel.send(MAIN.mention(message.author.id) + " will be DM'ed once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + "excludeDM** *true/false*");
        return -1;
    }
}
exports.excludeDM = excludeDM;

async function gameStats(message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");

    if (params != null) {
        if (params.userList) {

            //MAIN.prettyEmbed(message, `Here are the users signed up for ${params.gameTitle}. Total: ${params.userList.length}.`, params.userList, -1, 1, 1);
            MAIN.prettyEmbed(message, params.userList, {
                description: `Here are the users signed up for ${params.gameTitle}. Total: ${params.userList.length}.`,
                modifier: 1, startTally: 1
            });
            return 1;
        }
    }
    else
        return -1;

    let game = Array.isArray(params) ? params[0].trim() : params;
    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");
    if (!args) { message.channel.send("You have to provide the name of a game whose stats you wish to see!"); return -1; }

    let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    finalEmbed.timestamp = new Date();

    let check = checkGame(games, params, user);

    if (check == -1) {

        message.channel.send(`I could not find any game match for ${params}`);
        return check;
    }
    else if (check.result[0].score != 0) {

        let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

        // MAIN.prettyEmbed(message, `**${game}** is not a valid game, if you meant one of the following, simply type the number you wish to use:`, prettyArray,
        //     -1, -1, 1, null, null, true);
        MAIN.prettyEmbed(message, prettyArray, {
            description: `**${game}** is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
            modifier: 1, selector: true
        });

        MAIN.specificCommandCreator(gameStats, [message, -1, user], check.result, user);
        return -11;
    }
    else {

        game = check.result[0].item;
        let users = await MAIN.getUsers();
        let signedUp = new Array();

        for (let i = 0; i < users.length; i++) {

            if (users[i].games.includes(game) && users[i].guilds.includes(message.guild.id))
                if (!users[i].kicked[users[i].guilds.indexOf(message.guild.id)]) {
                    signedUp.push(message.guild.members.cache.get(users[i].id).displayName);
                }
        }

        if (signedUp.length > 0) {
            return MAIN.generalMatcher(message, -23, user, ['Yes', 'No'], [{ userList: signedUp, gameTitle: game }, null], gameStats, `There are **${signedUp.length}** user(s) signed up for ${game}. Would you like to see a list of the members who signed up?`);
        }
        else
            message.channel.send(`There are **${signedUp.length}** users signed up for ${game}.`);
        return signedUp.length;
    }

}
exports.gameStats = gameStats;

async function topGames(message, params) {
    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");

    let users = await MAIN.getUsers();
    let gameMap = new Map();
    let description = '';
    let fieldArray = new Array();

    let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    finalEmbed.timestamp = new Date();
    finalEmbed.description = "Here are the top stats for " + message.guild.name;
    finalEmbed.thumbnail.url = message.guild.iconURL();

    for (let i = 0; i < users.length; i++) {

        if (users[i].guilds.includes(message.guild.id)) {

            if (!users[i].kicked[users[i].guilds.indexOf(message.guild.id)]) {
                let tempGames = users[i].games;

                for (let j = 0; j < tempGames.length; j++) {

                    if (tempGames[j].length > 2) {

                        if (!gameMap.get(tempGames[j])) {

                            gameMap.set(tempGames[j], 1);
                        }
                        else {
                            gameMap.set(tempGames[j], (gameMap.get(tempGames[j]) + 1));
                        }
                    }
                }
            }
        }
    }

    gameMap = [...gameMap.entries()].sort(function (a, b) { return b[1] - a[1] });

    let maxResults = 5;

    if (Array.isArray(params)) params = Math.floor(Number(params[0]));

    if (!(isNaN(params)))
        maxResults = params <= 0 ? 5 : Math.floor(Number(params));

    if (gameMap.length == 0) {
        message.channel.send(`No one has signed up for any games in ${message.guild.name}, be the first!`);
        return;
    }
    else if (maxResults > gameMap.length && maxResults) {

        maxResults = gameMap.length;
        description = `There are only *${maxResults}* games people signed up for on ${message.guild.name}`;
    }
    else {
        if (params <= 0)
            description = `You did not specify a valid number of games to display, as such, I will display the top ${maxResults}`
                + ` games people signed up for on the ${message.guild.name} server:`;
        else
            description = `Displaying the top **${maxResults}** games people signed up for on the ${message.guild.name} server:`;
    }

    for (let i = 0; i < maxResults; i++) {

        fieldArray.push(`<${gameMap[i][1]} User(s) signed up for ${gameMap[i][0]}>\n`);
    }

    //MAIN.prettyEmbed(message, description, fieldArray, -1, 1, 'md');
    MAIN.prettyEmbed(message, fieldArray, { description: description, modifier: 'md', startTally: 1 });
    return gameMap.length;
}
exports.topGames = topGames;

async function Queue(message, params, user, emoji) {

    if (emoji) {
        let squads = guildSquads.get(message.guild.id);
        if (squads && (squads.length != 0)) {

            for (let squad of squads.values()) {
                if (squad.messageID == message.id) {

                    if (squad.joinedIDS.includes(emoji.id)) return -1;

                    if (squad.displayNames.length < squad.size) {
                        squad.displayNames.push(user.username);
                        squad.joinedIDS.push(user.id);
                        return 1;
                        break;
                    }
                    else {
                        return -2;
                    }
                }
            }
        }
    }
    else {

        if (message.channel.type != 'text') { message.channel.send("This is a server-text channel exclusive command!"); return -1; }

        let squads = guildSquads.get(message.guild.id);

        if (!squads) { message.channel.send("There are no active summons in the server to queue for!"); return 0; }

        if (squads.length == 0) { message.channel.send("There aren't any summons active, start a new one? :wink:"); return 0; }

        let ETA;
        if (message.content.includes(','))
            ETA = message.content.split(',')[1];
        else if (message.mentions.members.size == 0)
            ETA = message.content.split(" ").slice(1).join(" ");

        if (ETA)
            ETA.trim();
        let finalETA = !isNaN(ETA) && ETA.length > 0 ? Number(ETA) : -1;
        if (finalETA < 0)
            finalETA = -1;

        if (squads.length == 1 || params.summon) {
            let squad = params.summon ? params.summon : squads.values().next().value;
            if (squad.displayNames.length < squad.size) {

                if (squad.joinedIDS.includes(user.id)) return message.channel.send("You have already joined this summon!");

                squad.displayNames.push(squad.message.guild.members.cache.get(user.id).displayName);
                squad.joinedIDS.push(user.id)
                if (finalETA == -1)
                    return await resetSummonRitual(squad.message, user.id, null, true);
                return await resetSummonRitual(squad.message, user.id, finalETA, true);
            }
            else { message.channel.send("There is no space left in the summon!"); return 0; }
        }
        else if (message.mentions.members.size > 0) {

            let squad = squads.find(element => element.summonerID == message.mentions.members.values().next().value.id);
            if (!squad) { message.channel.send("That user does not have any active summoninings!"); return 0; }
            if (squad.displayNames.length < squad.size) {

                if (squad.joinedIDS.includes(user.id)) return message.channel.send("You have already joined this summon!");
                squad.displayNames.push(squad.message.guild.members.cache.get(user.id).displayName);
                squad.joinedIDS.push(user.id)
                if (finalETA == -1)
                    return await resetSummonRitualresetSummonRitual(squad.message, user.id, null, true);
                return await resetSummonRitual(squad.message, user.id, finalETA, true);
                // let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
                // newEmbed.description = (finalETA == -1) ? `${MAIN.mention(user.id)} has joined the summon!` : `${MAIN.mention(user.id)} is arriving, they will be there in ${finalETA} minutes!`;
                // newEmbed.fields = [{ name: `Current squad members: ${squad.displayNames.length}/${squad.size}`, value: squad.displayNames }];
                // return message.channel.send({ embed: newEmbed });
            }
            else { message.channel.send("There is no space left in the summon!"); return 0; }
        }
        else {

            let searchArray = [];
            let internalArray = [];

            for (let squad of squads.entries()) {
                searchArray.push(`${squad[1].summoner}'s Summon: ${squad[1].displayNames.length}/${squad[1].size}`);
                internalArray.push({ summon: squad[1] });
            }

            return MAIN.generalMatcher(message, -23, user, searchArray, internalArray, Queue, "There are more than one active summon, please enter the number whose summon you wish to answer!");
        }
    }
}
exports.Queue = Queue;

async function deQueue(message, params, user, emoji) {

    if (emoji) {
        let squads = guildSquads.get(message.guild.id);
        if (squads && (squads.length != 0)) {

            for (let squad of squads.values()) {
                if (squad.messageID == message.id) {

                    if (!squad.joinedIDS.includes(emoji.id)) return -1;

                    if (squad.summonerID == emoji.id) {
                        squad.collector.stop();
                        squad.message.delete();
                        squads.splice(squads.indexOf(squad), 1);
                        return 1;
                    }

                    squad.joinedIDS.splice(squad.joinedIDS.indexOf(emoji.id), 1);
                    squad.displayNames.splice(squad.displayNames.indexOf(emoji.displayName), 1);
                    return 2;
                }
            }
        }
    }
    else {

        if (message.channel.type != 'text') { message.channel.send("This is a server-text channel exclusive command!"); return -1; }

        let squads = guildSquads.get(message.guild.id);

        if (!squads) { message.channel.send("There are no active summons in the server to deQueue from!"); return 0; }

        if (squads.length == 0) { message.channel.send("There aren't any summons active, start a new one? :wink:"); return 0; }

        let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;

        if (mentionID != -1) {

            let squad = squads.find(element => element.summonerID == mentionID);
            if (!squad) { message.channel.send(`${MAIN.mention(mentionID)} doesn't have a summon!`); return 0; }
            if (squad.summonerID == user.id) {
                message.channel.send("You have cancelled your summon!");
                //      squad.joinedIDS.splice(squad.joinedIDS.indexOf(user.joinedIDS), 1);
                squad.message.delete();
                squads.splice(squads.indexOf(squad), 1);
                return 1;
                //return resetSummonRitual(squad.message, user.id, null, false);
            }

            if (!squad.joinedIDS.includes(user.id)) { message.channel.send("You have not joined this summon to leave it yet!"); return 0; }

            message.channel.send(`Left ${squad.summoner}'s summon!`);
            squad.joinedIDS.splice(squad.joinedIDS.indexOf(user.id), 1);
            squad.displayNames.splice(squad.displayNames.indexOf(squad.message.guild.members.cache.get(user.id).displayName), 1);
            return await resetSummonRitual(squad.message, user.id, null, false);
            //return squad.players.splice(squad.players.indexOf(mentionID), 1);
        }
        else {
            for (let squad of squads) {
                if (squad.summonerID == user.id) {
                    squad.message.channel.send("You have destroyed your summon!");
                    squad.message.delete();
                    squads[squads.indexOf(squad)] = -1;

                }
                else if (squad.joinedIDS.includes(user.id)) {
                    message.channel.send("You have left " + squad.message.guild.members.cache.get(squad.summonerID).displayName + "'s summon!");
                    squad.displayNames.splice(squad.displayNames.indexOf(squad.message.guild.members.cache.get(user.id).displayName), 1);//cannot splice on undefined
                    squad.joinedIDS.splice(squad.joinedIDS.indexOf(user.joinedIDS), 1);
                    await resetSummonRitual(squad.message, user.id, null, false);
                }
            }

            while (squads.includes(-1))
                squads.splice(squads.indexOf(-1), 1);

            return 1;
        }
    }
}
exports.deQueue = deQueue;

async function viewActiveSummons(message, params, user) {

    if (message.channel.type != 'text') return message.channel.send("This is a server-text channel exclusive command!");

    let squads = guildSquads.get(message.guild.id);
    if (!squads) return message.channel.send("There are no active summons in the server to view!");

    if (squads.length == 0) return message.channel.send("There are no active summons in the server to view!");
    if (squads.length == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

    let fieldArray = new Array();

    for (let squad of squads.entries()) {

        fieldArray.push({
            name: `${squad[1].summoner}'s Summon: ${squad[1].displayNames.length}/${squad[1].size}`, value: squad[1].displayNames.reduce((acc, current, index) => {
                acc.push(`${index}) ${current}`);
                return acc;
            }, [])
        });
    }

    //MAIN.prettyEmbed(message, `There are ${squads.length} active summon(s)!`, fieldArray, -1, -1, 1);
    MAIN.prettyEmbed(message, fieldArray, { description: `There are ${squads.length} active summon(s)!`, modifier: 1 });
}
exports.viewActiveSummons = viewActiveSummons;

async function banish(message, params, user, emoji) {

    {

        if (message.channel.type != 'text') { message.channel.send("This is a server-text channel exclusive command!"); return -1; }

        let squads = guildSquads.get(message.guild.id);
        if (!squads) { message.channel.send("There are no active summons in the server to banish from!"); return 0; }

        let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;
        let squad = squads.find(element => element.summonerID == user.id);

        if (!squad) {
            if (emoji)
                MAIN.selfDestructMessage(message, `Only the original summoner can kick from this summon!`, 3, true)
            else
                message.channel.send("You don't have any active summons to kick from!");
            return 0;
        }

        if (mentionID != -1) {
            if (mentionID == user.id) return message.channel.send("You can't banish yourself from the summon, use the dq command instead!");
            for (let squad of squads)
                if (squad.summonerID == user.id) {
                    if (squad.displayNames.indexOf(message.mentions.members.values().next().value.displayName) != -1) {
                        squad.joinedIDS.splice(squad.joinedIDS.indexOf(message.mentions.members.values().next().value.id));
                        message.channel.send(`${squad.displayNames.splice(squad.displayNames.indexOf(message.mentions.members.values().next().value.displayName), 1)} has been banished from your summon!`);
                        await resetSummonRitual(squad.message, message.mentions.members.values().next().value.id, null, false);
                    }
                }
            message.channel.send("Either you don't have an active summon or such player wasn't part of it!");
            return 0;
        }
        else if (params.player) {
            squad.joinedIDS.splice(squad.joinedIDS.indexOf(params.id));
            message.channel.send(`${squad.displayNames.splice(squad.displayNames.indexOf(params.player), 1)} has been banished from your summon!`);
            return await resetSummonRitual(squad.message, params.id, null, false);
        }
        else {

            let searchArray = [];
            let internalArray = [];

            for (let i = 0; i < squad.displayNames.length; i++) {

                if (squad.joinedIDS[i] != squad.summonerID) {
                    searchArray.push(squad.displayNames[i]);
                    internalArray.push({ player: squad.displayNames[i], id: squad.joinedIDS[i] });
                }
            }

            if (searchArray.length == 0) { MAIN.selfDestructMessage(message, "There is no one to banish from your summon!", 3, !emoji); return -1; }

            return MAIN.generalMatcher(message, -23, user, searchArray, internalArray, banish, "Enter the number of the player you wish to banish from your summon!");
        }
    }
}
exports.banish = banish;

function removeGame(message, game, user) {

    if (user.games.length < 1 && !game.mass) {

        message.channel.send(`You have no games in your games list, please sign up for some with ${prefix}` + `signUp`);
        return -1;
    }
    else {

        let mass;
        if (!game.mass) {
            if (Array.isArray(game)) {
                let setty = new Set(game);
                game = Array.from(setty);
            }
            else {

                game = [game];
            }
        }
        else {
            mass = game.mass;
            game = game.game;
        }

        let gameArr = user.games;
        let invalidGames = new Array();
        let removedGames = new Array();

        games.sort();
        if (game.length == 1) {

            if (isNaN(game[0]) && (game[0].length > 0)) {
                let check = checkGame(user.games, game, user);
                if ((check == -1)) {

                    if (!mass)
                        message.channel.send("No such game exists in you playlist, try again?");
                    return check;
                }
                else if ((check.result[0].score != 0) && !mass) {

                    let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

                    // let removeEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
                    // removeEmbed.timestamp = new Date();
                    // removeEmbed.title = MAIN.Embed.title + ` Game Commands`;
                    // removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;
                    let fields = [];

                    for (suggestion of prettyArray)
                        fields.push({ value: suggestion, name: "** **" });

                    //message.channel.send({ embed: removeEmbed });
                    // MAIN.prettyEmbed(message, `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
                    //     removeEmbed.fields, -1, -1, 1, null, null, true);
                    MAIN.prettyEmbed(message, fields, {
                        description: `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
                        modifier: 1, selector: true
                    });
                    MAIN.specificCommandCreator(removeGame, [message, -1, user], check.result, user);
                    return -11;
                }
                else {

                    game[0] = check.result[0].item;
                }
            }
        }

        for (currGame of game) {
            let gameTitle = currGame;

            if (isNaN(gameTitle)) {
                gameTitle = gameTitle.trim();

                if (gameArr.includes(gameTitle)) {
                    removedGames.push(gameTitle);
                    gameArr[gameArr.indexOf(gameTitle)] = -1;
                }
                else
                    invalidGames.push(gameTitle);
            }
            else {
                gameTitle = Math.floor(gameTitle);
                gameTitle--;
                if (gameTitle < gameArr.length && gameTitle >= 0) {
                    removedGames.push(gameArr[gameTitle]);
                    gameArr[gameTitle] = -1;
                }
                else
                    invalidGames.push(gameTitle);
            }
        }

        while (gameArr.includes(-1)) {
            gameArr.splice(gameArr.indexOf(-1), 1);
        }

        gameArr.sort();

        let fieldArray = [];


        if (invalidGames.length > 0) {
            invalidGames.sort();
            let invalidGameField = { name: "Invalid Game(s)", value: "" };
            for (let i = 0; i < invalidGames.length; i++) {
                invalidGameField.value += (i + 1) + ") " + invalidGames[i] + "\n";
            }
            fieldArray.push(invalidGameField);
        }

        if (removedGames.length > 0) {
            removedGames.sort();
            let removedGameField = { name: "Removed Game(s)", value: "" };
            for (let i = 0; i < removedGames.length; i++) {
                removedGameField.value += (i + 1) + ") " + removedGames[i] + "\n";
            }
            fieldArray.push(removedGameField);
        }

        if (!mass)
            MAIN.prettyEmbed(message, fieldArray, { modifier: 1 });
        //MAIN.prettyEmbed(message, '', fieldArray, -1, -1, 1);


        gameArr.sort();
        User.findOneAndUpdate({ id: user.id }, { $set: { games: gameArr } },
            function (err, doc, res) {
                //console.log(doc);
            });

        if (removedGames.length > 0)
            return removedGames.length;
        else
            return 0;
    }
}
exports.removeGame = removeGame;

async function removeGameFromAllUsers(message, game, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is exclusive to server-text channels!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can forcefully signup players on the server!");
    const args = message.content.split(" ").slice(1).join(" ");
    if (!args) { message.channel.send("You have to provide the name or number of a game for which you want to signUp for!"); return -1; }

    if (!game.valid) {

        let internalArray = [];

        for (GAME of games)
            internalArray.push({ valid: true, game: GAME });
        return MAIN.generalMatcher(message, game, user, games, internalArray, removeGameFromUsers, "Select the number of the game you wish to remove from every server member's games list");
    }


    let users = await MAIN.getUsers();
    let tally = 0;

    for (currUser of users) {

        if (message.guild.members.cache.get(currUser.id)) {
            removeGame(message, { game: game.game, mass: true }, currUser);
            tally++;
        }
    }

    return message.channel.send(`${tally} users have had ${game.game} removed from their games list!`);
}
exports.removeGameFromAllUsers = removeGameFromAllUsers;

async function removeGameFromSpecificUser(message, game, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is exclusive to server-text channels!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can forcefully remove games from others on the server!");
    if (message.mentions.members.size < 1) return message.channel.send("You have to @mention at least one other member!");

    const args = game.valid ? game.game : game[0].split(" ");
    if (args[0].includes('<@!')) return message.channel.send("You first have to provide the name or number of a game which you want to remove for!");

    if (!game.valid) {

        let internalArray = [];

        for (GAME of games)
            internalArray.push({ valid: true, game: GAME });
        return MAIN.generalMatcher(message, args[0], user, games, internalArray, removeGameFromSpecificUser, "Select the number of the game you wish to remove from the specified member's games list");
    }

    let finalList = [];

    for (member of message.mentions.members.values()) {
        let tempUser = await MAIN.findUser({ id: member.id });
        finalList.push(tempUser.displayName);
        removeGame(message, { game: game.game, mass: true }, tempUser);
    }

    return message.channel.send(`Succesfully removed ${game.game} from: *${finalList}*`);
}
exports.removeGameFromSpecificUser = removeGameFromSpecificUser;

async function signUpSpecificUser(message, game, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is exclusive to server-text channels!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can forcefully signUp others for games on the server!");
    if (message.mentions.members.size < 1) return message.channel.send("You have to @mention at least one other member!");

    const args = game.valid ? game.game : game[0].split(" ");
    if (args[0].includes('<@!')) return message.channel.send("You first have to provide the name or number of a game which you want to signUp for!");

    if (!game.valid) {

        let internalArray = [];

        for (GAME of games)
            internalArray.push({ valid: true, game: GAME });
        return MAIN.generalMatcher(message, args[0], user, games, internalArray, signUpSpecificUser, "Select the number of the game you wish to signUp to the specified member's games list");
    }

    let finalList = [];

    for (member of message.mentions.members.values()) {
        if (member.user.bot) {

            message.channel.send(`${member.displayName} is a bot and cannot be signed up for games!`);
            continue;
        }
        let tempUser = await MAIN.findUser({ id: member.id });
        finalList.push(message.guild.members.cache.get(member.id).displayName);
        updateGames(message, { game: game.game, mass: true }, tempUser);
    }

    if (finalList.length > 0)
        return message.channel.send(`Succesfully signedUp ${game.game} for: *${finalList}*`);
    return message.channel.send(`There was no valid member to signUp for ${game.game}`);
}
exports.signUpSpecificUser = signUpSpecificUser;

async function signUpAllUsers(message, game, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is exclusive to server-text channels!");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only administrators can forcefully signup players on the server!");

    if (Array.isArray(game)) {
        let setty = new Set(game);
        game = Array.from(setty);
    }
    else
        game = [game];

    const args = message.content.split(" ").slice(1).join(" ");
    if (!args) { message.channel.send("You have to provide the name or number of a game for which you want to signUp for!"); return -1; }

    let users = await MAIN.getUsers();
    let tally = 0;

    for (currUser of users) {

        let member = message.guild.members.cache.get(currUser.id);

        if (member && !member.user.bot) {
            updateGames(message, { game: game, mass: true }, currUser);
            tally++;
        }
    }

    return message.channel.send(`${tally} users have been signed up for ${game}!`);
}
exports.signUpAllUsers = signUpAllUsers;

async function updateGames(message, game, user) {

    let mass = game.mass;
    game = game.mass ? game.game : game;

    if (Array.isArray(game)) {
        let setty = new Set(game);
        game = Array.from(setty);
    }
    else
        game = [game];

    const args = message.content.split(" ").slice(1).join(" ");
    if (!args) { message.channel.send("You have to provide the name or number of a game for which you want to signUp for!"); return -1; }

    games.sort();
    let existingGames = user.games;
    let finalGameArray = new Array();
    let alreadyTracked = new Array();
    let invalidGames = new Array();

    if (game.length == 1) {

        let check = checkGame(games, game, user);

        if (check == -1) {

            message.channel.send("I could not find any matching games, try again?");
            return check;
        }
        else if (check.result[0].score != 0) {

            let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);
            //let removeEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
            // removeEmbed.date = new Date();
            // removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;

            let fields = [];
            for (suggestion of prettyArray)
                fields.push({ value: suggestion, name: "** **" });

            //message.channel.send({ embed: removeEmbed });
            MAIN.prettyEmbed(message, fields, {
                description: `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
                modifier: 1, selector: true
            });
            // MAIN.prettyEmbed(message, `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`,
            //     removeEmbed.fields, -1, -1, 1, null, null, true);
            MAIN.specificCommandCreator(updateGames, [message, -1, user], check.result, user);
            return -11;
        }
        else {

            game[0] = check.result[0].item;
        }
    }

    for (let i = 0; i < game.length; i++) {
        gameTitle = game[i];

        gameTitle = gameTitle.trim();

        if (isNaN(gameTitle)) {

            gameTitle = gameTitle.trim();

            if (games.includes(gameTitle)) {
                if (!existingGames.includes(gameTitle)) {
                    finalGameArray.push(gameTitle);
                }
                else
                    alreadyTracked.push(gameTitle);
            }
            else
                invalidGames.push(gameTitle);
        }
        else {
            gameTitle = Math.floor(gameTitle);
            if (gameTitle < games.length && gameTitle >= 0) {

                if (!existingGames.includes(games[gameTitle])) {
                    finalGameArray.push(games[gameTitle]);
                }
                else
                    alreadyTracked.push(games[gameTitle]);
            }
            else
                invalidGames.push(games[gameTitle]);
        }
    }

    let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    finalEmbed.timestamp = new Date();

    if (finalGameArray.length > 0) {
        finalGameArray.sort();
        let signedField = { name: "Game(s) Succesfully Signup For:", value: "" };
        for (let i = 0; i < finalGameArray.length; i++) {
            signedField.value += (i + 1) + ") " + finalGameArray[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    if (alreadyTracked.length > 0) {
        alreadyTracked.sort();
        let signedField = { name: "Game(s) Already Tracked For You:", value: "" };
        for (let i = 0; i < alreadyTracked.length; i++) {
            signedField.value += (i + 1) + ") " + alreadyTracked[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    if (invalidGames.length > 0) {
        invalidGames.sort();
        let signedField = { name: "Invalid Game(s):", value: "" };
        for (let i = 0; i < invalidGames.length; i++) {
            signedField.value += (i + 1) + ") " + invalidGames[i] + '\n';
        }
        finalEmbed.fields.push(signedField);
    }

    if (!mass)
        message.channel.send({ embed: finalEmbed });

    let length = finalGameArray.length == 0 ? -1 : finalGameArray.length;
    if (user.games)
        finalGameArray = finalGameArray.concat(user.games).filter(v => (v));//removing nulls or undefined

    finalGameArray.sort();
    User.findOneAndUpdate({ id: user.id },
        {
            $set: { games: finalGameArray }
        }, function (err, doc, res) {
            //console.log(doc);
        });

    return length;
}
exports.updateGames = updateGames;

async function squadTrack() {

    if (guildSquads.size > 0)
        for (guildSq of guildSquads.entries())
            for (squad of guildSq[1])
                if ((new Date() - squad.created) >= 1800000)
                    guildSquads.delete(guildSq[0]);
}
setInterval(squadTrack, 1000);