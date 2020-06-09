
const Fuse = require('fuse.js');
const studyJSON = require('./medstudy.json');
const MAIN = require('./short-answer.js');
const studyArray = new Array();

for (let element of studyJSON)
    studyArray.push(element);

async function shakeUser(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a server voice channel and send the command from a server!");

    let targetMember = message.mentions.members.first();
    if (message.member.roles.highest.comparePositionTo(targetMember.roles.highest) < 0) return message.channel.send("You can't shake a user with a higher role than yours!");

    let startingChannel = targetMember.voice.channel;
    if (!startingChannel) return message.channel.send("The user needs to be in this server's voice channel!");


    let voiceChannels = message.guild.channels.cache.filter(channel => channel.type == 'voice').filter(channel => channel.permissionsFor(targetMember).has('CONNECT')).array();
    if (voiceChannels.length == 1) return message.channel.send(`There are no other voice channels that ${targetMemeber.displayName} can be moved to!`);

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

        for (guild of Client.guilds.cache.values()) {
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
        for (guild of Client.guilds.cache.values()) {
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



async function reactAnswers(message) {

    await message.react("🇦");
    await message.react("🇧");
    await message.react("🇨");
    await message.react("🇩");
    await message.react("🇪");
    await message.react("🇫");
}