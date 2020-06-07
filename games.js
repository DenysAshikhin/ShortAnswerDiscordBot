const gameJSON = require('./gameslist.json');
const MAIN = require('./short-answer.js');
const Fuse = require('fuse.js');
const User = require('./User.js');
const Commands = require('./commands.json');

var games = new Array();
var guildSquads = new Map();


for (let element of gameJSON)
    games.push(element.name);
games.sort();


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

        MAIN.prettyEmbed(message, `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`, tempArray, -1, -1, 1);
        MAIN.specificCommandCreator(pingUsers, [message, -1, user], check.result, user);
        return -11;
    }
    else {

        game = check.result[0].item;

        let users = await MAIN.getUsers();
        let signedUp = "";
        let defaulted = "";
        let commonUsers = [];

        const voiceChannel = message.member.voice.channel;
        if (voiceChannel)
            for (member of voiceChannel.members)
                commonUsers.push(member[0]);

        for (let user of users) {
            if ((user.id != message.author.id) && (user.id != MAIN.botID)) {

                if (user.guilds.includes(message.guild.id)) {

                    if (!user.kicked[user.guilds.indexOf(message.guild.id)]) {

                        if (isNaN(game)) {

                            if (user.games.includes(game)) {

                                if ((user.excludePing == false) && !(commonUsers.includes(user.id)))
                                    signedUp += MAIN.mention(user.id) + " ";
                                else
                                    signedUp += `${user.displayName} `;

                                if ((user.excludeDM == false) && !(commonUsers.includes(user.id)))
                                    MAIN.directMessage(message, user.id, game);
                            }
                        }
                        else if (user.games.includes(games[game])) {
                            if ((user.excludePing == false) && !(commonUsers.includes(user.id)))
                                signedUp += MAIN.mention(user.id) + " ";
                            else
                                signedUp += `${user.displayName} `;

                            if ((user.excludeDM == false) && !(commonUsers.includes(user.id)))
                                MAIN.directMessage(message, user.id, games[game]);
                        }
                        else if (user.games.length < 2) {

                            defaulted += MAIN.mention(user.id);
                        }
                    }
                }
            }
            else if (commonUsers.includes(user.id)) {

            }
        }//Each user for loop

        let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        finalEmbed.timestamp = new Date();
        finalEmbed.description = message.member.displayName + " has summoned " + signedUp + " for some " + game
            + "```fix\n" + `To accept the summons type ${prefix}q` + "```";

        if (signedUp.length > 3) {

            let squads = guildSquads.get(message.guild.id);

            if (squads) {
                let squad = squads.find(element => element.summonerID == user.id);
                if (squad) {
                    squads.splice(squads.indexOf(squad), 1);
                    message.channel.send("Overwriting your old summon!");
                }
            }

            if (squads)
                squads.push({ game: game, displayNames: [user.displayName], size: squadSize, created: new Date(), summoner: user.displayName, summonerID: user.id });
            else
                guildSquads.set(message.guild.id, [{ game: game, displayNames: [user.displayName], size: squadSize, created: new Date(), summoner: user.displayName, summonerID: user.id }])
            message.channel.send({ embed: finalEmbed });


            // for (let i = 0; i < 25; i++) {

            //     let tempPlayers = [];

            //     for (let j = 0; j < 7; j++) {

            //         tempPlayers.push(`${user.displayName} ${i}-${j}`);
            //     }
            //     let squads = guildSquads.get(message.guild.id);
            //     squads.push({ game: game, displayNames: JSON.parse(JSON.stringify(tempPlayers)), size: squadSize, created: new Date(), summoner: user.displayName + i, summonerID: user.id });
            // }



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

        finalList += (i+1) + ") " + result[i].item + "\n";
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

    MAIN.prettyEmbed(message, display + " here are the games you are signed up for:", gameArr, -1, 1, 1);

    if (games.length <= 0)
        message.channel.send("You are not signed up for any games.");

    return 0;
}
exports.personalGames = personalGames;

function search(message, searches) {

    if (searches == undefined || searches == null || searches.length < 1) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + Commands.commands[1] + " counter");
        return -1;
    }
    if (searches.length == 1 && (searches[0].toUpperCase() == (prefix.toUpperCase() + Commands.commands[1]))) {

        message.channel.send("You didn't provide a search criteria, try again - i.e. " + prefix + Commands.commands[1] + " counter");
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
                MAIN.prettyEmbed(message, `Here are the results for: ${query}`, fieldArray, -1, -1, 1);
        }

    }//for loop

    if (foundOne)
        return 1;
    return 0;
}
exports.search = search;

function excludePing(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
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
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[5] + "** *true/false*");
        return -1;
    }
}
exports.excludePing = excludePing;

function excludeDM(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {
        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: true } }, function (err, doc, res) {
            if (err) {
                console.log(err);
                Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
            }
        });
        message.channel.send(MAIN.mention(message.author.id) + " will be excluded from any further DMs.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { excludeDM: false } }, function (err, doc, res) {
            if (err) {
                console.log(err)
                Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
            }
        });
        message.channel.send(MAIN.mention(message.author.id) + " will be DM'ed once more.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[6] + "** *true/false*");
        return -1;
    }
}
exports.excludeDM = excludeDM;

async function gameStats(message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command is only available in server text channels!");

    if (params != null) {
        if (params.userList) {

            MAIN.prettyEmbed(message, `Here are the users signed up for ${params.gameTitle}. Total: ${params.userList.length}.`, params.userList, -1, 1, 1);
            return 1;
        }
    }
    else
        return -1;

    let game = Array.isArray(params) ? params[0].trim() : params;
    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to provide the name of a game whose stats you wish to see!");

    let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    finalEmbed.timestamp = new Date();

    let check = checkGame(games, params, user);

    if (check == -1) {

        message.channel.send(`I could not find any game match for ${params}`);
        return check;
    }
    else if (check.result[0].score != 0) {

        let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

        MAIN.prettyEmbed(message, `**${game}** is not a valid game, if you meant one of the following, simply type the number you wish to use:`, prettyArray,
            -1, -1, 1);

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
                    signedUp.push(users[i].displayName);
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

    MAIN.prettyEmbed(message, description, fieldArray, -1, 1, 'md');
    return gameMap.length;
}
exports.topGames = topGames;

async function Queue(message, params, user) {

    if (message.channel.type != 'text') return message.channel.send("This is a server-text channel exclusive command!");

    let squads = guildSquads.get(message.guild.id);

    if (!squads) return message.channel.send("There are no active summons in the server to queue for!");

    if (squads.length == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

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

            if (squad.displayNames.includes(user.displayName)) return message.channel.send("You have already joined this summon!");

            squad.displayNames.push(user.displayName);
            let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
            newEmbed.description = (finalETA == -1) ? `${MAIN.mention(user.id)} has joined the summon!` : `${MAIN.mention(user.id)} is arriving, they will be there in ${finalETA} minutes!`;
            newEmbed.fields = [{ name: `Current summons members: ${squad.displayNames.length}/${squad.size}`, value: squad.displayNames }];
            return message.channel.send({ embed: newEmbed });
        }
        else return message.channel.send("There is no space left in the summon!");
    }
    else if (message.mentions.members.size > 0) {

        let squad = squads.find(element => element.summonerID == message.mentions.members.values().next().value.id);
        if (!squad) return message.channel.send("That user does not have any active summoninings!");
        if (squad.displayNames.length < squad.size) {

            if (squad.displayNames.includes(user.displayName)) return message.channel.send("You have already joined this summon!");
            squad.displayNames.push(user.displayName);

            let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
            newEmbed.description = (finalETA == -1) ? `${MAIN.mention(user.id)} has joined the summon!` : `${MAIN.mention(user.id)} is arriving, they will be there in ${finalETA} minutes!`;
            newEmbed.fields = [{ name: `Current squad members: ${squad.displayNames.length}/${squad.size}`, value: squad.displayNames }];
            return message.channel.send({ embed: newEmbed });
        }
        else return message.channel.send("There is no space left in the summon!");
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
exports.Queue = Queue;

async function deQueue(message, params, user) {

    if (message.channel.type != 'text') return message.channel.send("This is a server-text channel exclusive command!");

    let squads = guildSquads.get(message.guild.id);

    if (!squads) return message.channel.send("There are no active summons in the server to deQueue from!");

    if (squads.length == 0) return message.channel.send("There aren't any summons active, start a new one? :wink:");

    let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;

    if (mentionID != -1) {

        let squad = squads.find(element => element.summonerID == mentionID);
        if (!squad) return message.channel.send(`${MAIN.mention(mentionID)} doesn't have a summon!`);
        if (squad.summoner == user.displayName) {
            message.channel.send("You have cancelled your summon!");
            return squads.splice(squads.indexOf(squad), 1);
        }

        if (!squad.displayNames.includes(user.displayName)) return message.channel.send("You have not joined this summon to leave it yet!");

        message.channel.send(`Left ${squad.summoner}'s summon!`);
        return squad.displayNames.splice(squad.displayNames.indexOf(user.displayName), 1);
        //return squad.players.splice(squad.players.indexOf(mentionID), 1);
    }
    else {
        for (let squad of squads) {
            if (squad.summonerID == user.id)
                squads[squads.indexOf(squad)] = -1;
            else if (squad.displayNames.includes(user.displayName))
                squad.displayNames.splice(squad.displayNames.indexOf(user.displayName), 1);//cannot splice on undefined
        }

        while (squads.includes(-1))
            squads.splice(squads.indexOf(-1), 1);

        return message.channel.send("You have destroyed any of your active summons!");
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

    MAIN.prettyEmbed(message, `There are ${squads.length} active summon(s)!`, fieldArray, -1, -1, 1);
}
exports.viewActiveSummons = viewActiveSummons;

async function banish(message, params, user) {

    if (message.channel.type != 'text') return message.channel.send("This is a server-text channel exclusive command!");

    let squads = guildSquads.get(message.guild.id);
    if (!squads) return message.channel.send("There are no active summons in the server to banish from!");

    let mentionID = message.mentions.members.size > 0 ? message.mentions.members.values().next().value.id : -1;
    let squad = squads.find(element => element.summonerID == user.id);

    if (!squad) return message.channel.send("You don't have any active summons to kick from!");

    if (mentionID != -1) {
        if (mentionID == user.id) return message.channel.send("You can't banish yourself from the summon, use the dq command instead!");
        for (let squad of squads)
            if (squad.summoner == user.displayName) {
                if (squad.displayNames.indexOf(message.mentions.members.values().next().value.displayName) != -1)
                    return message.channel.send(`${squad.displayNames.splice(squad.displayNames.indexOf(message.mentions.members.values().next().value.displayName), 1)} has been banished from your summon!`);
            }
        return message.channel.send("Either you don't have an active summon or such player wasn't part of it!");
    }
    else if (params.player) {

        return message.channel.send(`${squad.displayNames.splice(squad.displayNames.indexOf(params.player), 1)} has been banished from your summon!`);
    }
    else {

        let searchArray = [];
        let internalArray = [];

        for (let i = 0; i < squad.displayNames.length; i++) {

            if (squad.displayNames[i] != user.displayName) {
                searchArray.push(squad.displayNames[i]);
                internalArray.push({ player: squad.displayNames[i] });
            }
        }

        if (searchArray.length == 0) return message.channel.send("There is no one to banish from your summon!");

        return MAIN.generalMatcher(message, -23, user, searchArray, internalArray, banish, "Enter the number of the player you wish to banish from your summon!");
    }
}
exports.banish = banish;

function removeGame(message, game, user) {

    if (user.games.length < 1 && !game.mass) {

        message.channel.send(`You have no games in your games list, please sign up for some with ${prefix}` + Commands.commands[2]);
        return;
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

            let check = checkGame(user.games, game, user);
            if ((check == -1)) {

                if (!mass)
                    message.channel.send("No such game exists in you playlist, try again?");
                return check;
            }
            else if ((check.result[0].score != 0) && !mass) {

                let prettyArray = check.prettyList.split('\n').filter(v => v.length > 1);

                let removeEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
                removeEmbed.timestamp = new Date();
                removeEmbed.title = MAIN.Embed.title + ` Game Commands`;
                removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;


                for (suggestion of prettyArray)
                    removeEmbed.fields.push({ name: suggestion, value: "** **" });

                message.channel.send({ embed: removeEmbed });
                MAIN.specificCommandCreator(removeGame, [message, -1, user], check.result, user);
                return -11;
            }
            else {

                game[0] = check.result[0].item;
            }
        }

        //game.forEach(async gameTitle => {make it for...of loop!
        let gameTitle = mass ? game : game[0];

        if (isNaN(gameTitle)) {

            if (gameArr.includes(gameTitle)) {
                removedGames.push(gameTitle);
                gameArr.splice(gameArr.indexOf(gameTitle), 1);
            }
            else
                invalidGames.push(gameTitle);
        }
        else {
            gameTitle = Math.floor(gameTitle);
            if (gameTitle < gameArr.length && gameTitle >= 0) {
                removedGames.push(gameArr[gameTitle]);
                gameArr.splice(gameTitle, 1)
            }
            else
                invalidGames.push(gameTitle);
        }
        //});

        gameArr.sort();


        let finalEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        finalEmbed.timestamp = new Date();


        if (invalidGames.length > 0) {
            invalidGames.sort();
            let invalidGameField = { name: "Invalid Game(s)", value: "" };
            for (let i = 0; i < invalidGames.length; i++) {
                invalidGameField.value += (i + 1) + ") " + invalidGames[i];
            }
            finalEmbed.fields.push(invalidGameField);
        }

        if (removedGames.length > 0) {
            removedGames.sort();
            let removedGameField = { name: "Removed Game(s)", value: "" };
            for (let i = 0; i < removedGames.length; i++) {
                removedGameField.value += (i + 1) + ") " + removedGames[i];
            }
            finalEmbed.fields.push(removedGameField);
        }

        if (!mass)
            message.channel.send({ embed: finalEmbed });


        gameArr.sort();
        User.findOneAndUpdate({ id: user.id },
            {
                $set: { games: gameArr }
            }, function (err, doc, res) {
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
    if (!args) return message.channel.send("You have to provide the name or number of a game for which you want to signUp for!");

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
        let tempUser = await MAIN.findUser({ id: member.id });
        finalList.push(tempUser.displayName);
        updateGames(message, { game: game.game, mass: true }, tempUser);
    }

    return message.channel.send(`Succesfully signedUp ${game.game} for: *${finalList}*`);
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
    if (!args) return message.channel.send("You have to provide the name or number of a game for which you want to signUp for!");

    let users = await MAIN.getUsers();
    let tally = 0;

    for (currUser of users) {

        if (message.guild.members.cache.get(currUser.id)) {
            updateGames(message, { game: game, mass: true }, currUser);
            tally++;
            console.log(currUser.displayName);
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
    if (!args) return message.channel.send("You have to provide the name or number of a game for which you want to signUp for!");

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
            let removeEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
            removeEmbed.date = new Date();
            removeEmbed.description = `${game} is not a valid game, if you meant one of the following, simply type the number you wish to use:`;


            for (suggestion of prettyArray)
                removeEmbed.fields.push({ name: suggestion, value: "** **" });

            message.channel.send({ embed: removeEmbed });
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

    for (guildSq of guildSquads.entries())
        for (squad of guildSq[1])
            if ((new Date() - squad.created) >= 1, 800, 000)
                guildSquads.delete(guildSq[0]);
}
setInterval(squadTrack, 1000);