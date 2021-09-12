const MAIN = require('./short-answer.js');
const Guild = require('./Guild.js');
const BOT = require('./Bot.js');

const isUrl = require('is-url');
const getYoutubeChannelId = require('get-youtube-channel-id');
const ytch = require('yt-channel-info')
const needle = require('needle');
const isImageUrl = require('is-image-url');
const isVideo = require('is-video');
const User = require('./User.js');


var autoRoleMap = new Map();
var autoRoleCollectors = [];


const channelImageThanker = async function (message, params, user) {

    let image = false;
    let video = false;
    const args = message.content.trim().replace(/[\n\r]/g, " ").split(' ');



    if (message.attachments.size > 0)
        for (let attachment of message.attachments.values()) {
            if (isImageUrl(attachment.attachment)) {

                image = true;
                break;
            } else if (isVideo(attachment.attachment)) {
                video = true;
                break;
            }
        }

    if (!image)
        for (let string of args)
            if (isImageUrl(string)) {
                let result = await needle('get', string)
                    .catch(err => {
                        console.log("caught thanker error is image url")
                    });
                if (result) {
                    image = true;
                    break;
                }
            }

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (image && video) {
        if (guild.thankerAutoRep) {

            changeRep(user, message.guild.id, 1, message);
        }

        if (guild.thankerMessageChannel.length > 0) {

            for (let channy of guild.thankerMessageChannel) {

                let channel = message.guild.channels.cache.get(channy);
                if (channel)
                    channel.send(channelThankerMessageConvert(message.author.id, `image and video`, guild));
            }
            return guild.thankerMessageChannel.length > 0;
        }
        return message.channel.send(channelThankerMessageConvert(message.author.id, `image and video`, guild));
    }

    if (image) {
        if (guild.thankerAutoRep) {

            changeRep(user, message.guild.id, 1, message);
        }

        if (guild.thankerMessageChannel.length > 0) {

            for (let channy of guild.thankerMessageChannel) {

                let channel = message.guild.channels.cache.get(channy);
                if (channel)
                    channel.send(channelThankerMessageConvert(message.author.id, `image`, guild));
            }
            return guild.thankerMessageChannel.length > 0;
        }
        return message.channel.send(channelThankerMessageConvert(message.author.id, `image`, guild));
    }
    if (video) {
        if (guild.thankerAutoRep) {

            changeRep(user, message.guild.id, 1, message);
        }

        if (guild.thankerMessageChannel.length > 0) {

            for (let channy of guild.thankerMessageChannel) {

                let channel = message.guild.channels.cache.get(channy);
                if (channel)
                    channel.send(channelThankerMessageConvert(message.author.id, `video`, guild));
            }
            return guild.thankerMessageChannel.length > 0;
        }
        return message.channel.send(channelThankerMessageConvert(message.author.id, `video`, guild));
    }

}
exports.channelImageThanker = channelImageThanker;

const channelLinkThanker = async function (message, params, user) {

    const args = message.content.trim().replace(/[\n\r]/g, " ").split(' ');

    let parsed = await MAIN.sendToServer({
        command: 'linkCheck',
        params: [message.guild.id, message.channel.id, message.id, args]
    });

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (parsed.reposts) {

        message.channel.send(`Your message contained ${parsed.reposts} reposted links`)
    }
    if (parsed.newLinks) {

        if (guild.thankerAutoRep) {

            changeRep(user, message.guild.id, parsed.newLinks, message);
        }
    } else {

        return 1;
    }

    if (guild.thankerMessageChannel.length > 0) {

        for (let channy of guild.thankerMessageChannel) {

            let channel = message.guild.channels.cache.get(channy);
            if (channel)
                channel.send(channelThankerMessageConvert(message.author.id, `link`, guild, parsed.newLinks));
        }
        return guild.thankerMessageChannel.length > 0;
    }

    return message.channel.send(channelThankerMessageConvert(message.author.id, `link`, guild, parsed.newLinks));
}
exports.channelLinkThanker = channelLinkThanker;

const setChannelImageThanker = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel thanker from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel thanker for the server")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.channelImageThanker.includes(message.channel.id)) {

        return message.channel.send("This channel is already being monitered for images!");
    }

    guild.channelImageThanker.push(message.channel.id);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImageThanker: guild.channelImageThanker
        }
    }).exec();
    return message.channel.send("This channel will now be monitered for images");
}
exports.setChannelImageThanker = setChannelImageThanker;

const unSetChannelImageThanker = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel thanker from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel thanker for the server")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelImageThanker.includes(message.channel.id)) {

        return message.channel.send("This channel is already not being monitered for images!");
    }

    //  console.log(guild.channelThanker.indexOf(message.channel.id))

    guild.channelImageThanker.splice(guild.channelImageThanker.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImageThanker: guild.channelImageThanker
        }
    }).exec();
    return message.channel.send("This channel will no longer be monitered for images");
}
exports.unSetChannelImageThanker = unSetChannelImageThanker;

const setChannelLinkThanker = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel thanker from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel thanker for the server")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.channelImageThanker.includes(message.channel.id)) {

        return message.channel.send("This channel is already being monitered for link!");
    }

    guild.channelLinkThanker.push(message.channel.id);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelLinkThanker: guild.channelLinkThanker
        }
    }).exec();
    return message.channel.send("This channel will now be monitered for links");
}
exports.setChannelLinkThanker = setChannelLinkThanker;

const unSetChannelLinkThanker = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel thanker from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel thanker for the server")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelLinkThanker.includes(message.channel.id)) {

        return message.channel.send("This channel is already not being monitered for links!");
    }

    //  console.log(guild.channelThanker.indexOf(message.channel.id))

    guild.channelLinkThanker.splice(guild.channelLinkThanker.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelLinkThanker: guild.channelLinkThanker
        }
    }).exec();
    return message.channel.send("This channel will no longer be monitered for links");
}
exports.unSetChannelLinkThanker = unSetChannelLinkThanker;


const channelThankerMessage = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel thanker message from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can change the channel thanker for the server")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });


    if ((!guild.channelImageThanker.includes(message.channel.id)) && (!guild.channelLinkThanker.includes(message.channel.id))) {

        return message.channel.send("This channel is not being monitered for links/images!");
    }

    //  console.log(guild.channelThanker.indexOf(message.channel.id))


    let args = message.content.split(" ").slice(1).join(" ").trim();

    if (args.length < 1) {
        return message.channel.send("The message has to be at least 1 character long!");
    }

    guild.channelThankerMessage = args;
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelThankerMessage: guild.channelThankerMessage
        }
    }).exec();
    await message.channel.send("Updated channel message to:");
    return message.channel.send(channelThankerMessageConvert(message.author.id, `link and/or image/video`, guild));
}
exports.channelThankerMessage = channelThankerMessage;

const channelThankerMessageConvert = function (userID, message, guild, amount) {

    let msg = amount ? `Thanks for the [] <>! ()` : `Thanks for the [] <>! ()`;



    if (guild.channelThankerMessage.length > 0)
        if (amount)
            return guild.channelThankerMessage.replace('<>', MAIN.mention(userID)).replace('[]', message).replace('()', `+${amount} rep!`)
        else
            return guild.channelThankerMessage.replace('<>', MAIN.mention(userID)).replace('[]', message).replace('()', `+${1} rep!`)

    if (amount)
        return msg.replace('<>', MAIN.mention(userID)).replace('[]', message).replace('()', `+${amount} rep!`)
    else
        return msg.replace('<>', MAIN.mention(userID)).replace('[]', message).replace('()', `+${1} rep!`)
}

async function initialiseUsers(message, params) {

    if (params.guild) {

        let memberList = await params.guild.members.fetch();
        let count = 0;
        for (let MEMBER of memberList.values()) {

            let member = MEMBER;

            await (MAIN.checkExistance(member))
            count++;

        }
        console.log(`members from a new guild: ${count}`);
        return 1;
    }

    if (message.channel.type == 'dm') return -1;

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can forcefully load all members from a server into the database" +
            " (only adds them if they are missing i.e. user joined while bot is down for updates).");

    if (!params.silent)
        message.channel.send("Started checking if the members of this server are in my database...may take some time for larger servers." +
            " I will let you know once I finish!");

    let newUsers = 0;
    let existingUsers = 0;

    let memberList = await message.channel.guild.members.fetch();

    for (let MEMBER of memberList.values()) {

        let member = MEMBER;

        if (await (MAIN.checkExistance(member))) { //User exists with a matching guild in the DB
            existingUsers++;
        } else {
            newUsers++;
        }
    }

    if (!params.silent)
        message.channel.send("The server's users are now tracked!" + ` ${existingUsers} were already present and ${newUsers} were added!`);
}
exports.initialiseUsers = initialiseUsers;

async function setDefaultServerPrefix(message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set the default server prefix from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set the default prefix for the server")



    if ((message.mentions.channels.size != 0) || (message.mentions.crosspostedChannels.size != 0) ||
        (message.mentions.members.size != 0) || (message.mentions.users.size != 0) ||
        (message.mentions.roles.size != 0) || (message.mentions.everyone) ||
        (message.content.includes('@everyone')) || (message.content.includes('@here')))
        return message.channel.send("You cannot have a mention when setting a prefix!");


    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    if (params.length > 5)
        return message.channel.send("Prefixes are limited a max of 5 characters!");
    // let index = user.guilds.indexOf(message.guild.id);
    // user.prefix[index] = params;

    if (params == -1) return message.channel.send(`You can't set your prefix to ${params}`);

    message.channel.send(`This server's default prefix is: "${params}"`);

    if (params == "sa!") params = -1;

    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            prefix: params
        }
    }, {
        new: true
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(doc.id, doc)
    });
    return 1;
}
exports.setDefaultServerPrefix = setDefaultServerPrefix;

const reactEmoji = async function (message, emojis) {

    for (let emojiPair of emojis) {

        //  console.log(emojiPair)

        if (emojiPair.emoji.includes(':')) {

            let id = emojiPair.emoji.substring(emojiPair.emoji.indexOf(':', 3) + 1, emojiPair.emoji.indexOf('>'));
            //   console.log(id);

            let guildEmoji = message.guild.emojis.cache.get(id);
            await message.react(guildEmoji)
                .catch(err => { });
        } else
            await message.react(emojiPair.emoji)
                .catch(err => { });
    }
}

const giveRoleSelf = async function (message, roleID) {

    let roleToAdd;
    let guildMember = message.guild.members.cache.get(MAIN.Client.user.id);
    try {
        roleToAdd = message.guild.roles.cache.get(roleID);
    } catch (err) {

        return -1;
    }

    if (roleToAdd) {
        let member1 = await guildMember.roles.add(roleToAdd)
            .catch(function (err) {

                message.channel.send("I don't have the required permission to give such a role!");
                return -1;
            });

        let member2 = await guildMember.roles.remove(roleToAdd)
            .catch(function (err) {
                message.channel.send("I don't have the required permission to revoke such a role!");
                return -1;
            });

        if (member2) {
            if (member2.id)
                return 1;
        }
        return -1;
    } else
        return -1;
}

const populateAutoRoleMap = function (autoRoleObj) {

    for (let pair of autoRoleObj)
        autoRoleMap.set(pair.messageID, pair);

}

const setEmojiCollecter = async function (autoroleObj, message) {

    let collector = await message.createReactionCollector(function (reaction, user) {
        return (!user.bot)
    }, {
        time: 60 * 60 * 1000,
        dispose: true
    });
    collector.on('collect', async function (emoji, user) {

        let tempEmoji = emoji._emoji;
        let autorole = autoRoleMap.get(emoji.message.id);

        let matchedPair = autorole.emojis.find(function (element) {

            //Universal Emoji
            if (!tempEmoji.id)
                return element.emoji == tempEmoji.name;

            else //Guild specific emoji
                return element.emojiID == tempEmoji.id

        });

        let userReacted = autorole.users.find(element => element == user.id);
        let guildMember = emoji.message.guild.members.cache.get(user.id);

        if (matchedPair) {
            if (userReacted && autorole.permenant) {

                emoji.users.remove(user);
                return MAIN.selfDestructMessage(emoji.message, 'You have already reacted to this message before! No takebacks!', 3, true);
            } else if (!userReacted && autorole.permenant) {

                let guild = await MAIN.findGuild({
                    id: emoji.message.guild.id
                });

                let index = guild.autorole.findIndex(element => element.messageID == emoji.message.id);

                if (index == -1) {
                    console.log(`emoji message id: ${emoji.message.id}`);
                    return console.log(`Issue finding exact autorole inside the guild??? ~~ index: ${autorole} ~~ guild: ${guild.id} ~~ guildName: ${guild.name}`);
                }

                guild.autorole[index].users.push(user.id);

                let roleToAdd;

                try {
                    roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
                } catch (err) {

                    return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");
                }

                if (roleToAdd)
                    await guildMember.roles.add(roleToAdd)
                        .catch(function (err) {

                            emoji.message.channel.send("I didn't have the required permission to give such a role!");
                        });
                else
                    return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");

                autoRoleMap.get(emoji.message.id).users.push(user.id);

                Guild.findOneAndUpdate({
                    id: guild.id
                }, {
                    $set: {
                        autorole: guild.autorole
                    }
                }, function (err, doc, res) { })
                return 1;

            }

            if (autorole.unique) {

                let foundUser;

                for (let reaction of message.reactions.cache.values()) {

                    if (reaction.emoji != tempEmoji)
                        if (reaction.users.cache.get(user.id)) {
                            foundUser = true;
                            break;
                        }
                }

                if (foundUser) {

                    emoji.users.remove(user);
                    return MAIN.selfDestructMessage(emoji.message, 'You have already reacted to this message, unreact with your previous one' +
                        ` (by clicking on it again) and then try again.`, 3, true);
                }

                for (let roly of autorole.roles) {

                    if (guildMember.roles.cache.get(roly)) {

                        emoji.users.remove(user);
                        return MAIN.selfDestructMessage(emoji.message, 'You already have one of the roles from the other reactions. You can' +
                            "'t get another until you remove the existing one.", 3, true);
                    }
                }
            }

            let roleToAdd;

            try {
                roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
            } catch (err) {

                return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");
            }

            if (roleToAdd)
                await guildMember.roles.add(roleToAdd)
                    .catch(function (err) {

                        emoji.message.channel.send("I didn't have the required permission to give such a role!");
                    });
            else
                return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");

        } else if (autorole.static) {

            return emoji.users.remove(user);

        } else { }
    });

    collector.on('remove', async function (emoji, user) {

        let tempEmoji = emoji._emoji;
        let autorole = autoRoleMap.get(emoji.message.id);

        if (autorole.permenant)
            return -1;

        let matchedPair = autorole.emojis.find(function (element) {

            //Universal Emoji
            if (!tempEmoji.id)
                return element.emoji == tempEmoji.name;

            else //Guild specific emoji
                return element.emojiID == tempEmoji.id

        });

        let userReacted = autorole.users.find(element => element == user.id);
        let guildMember = emoji.message.guild.members.cache.get(user.id);

        let roleToAdd;

        try {
            roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
        } catch (err) {

            console.log(err)
            return emoji.message.send("A role that was used in the autorole message no longer exists, failed to remove the role.");
        }

        if (roleToAdd)
            await guildMember.roles.remove(roleToAdd)
                .catch(function (err) {

                    emoji.message.channel.send("I didn't have the required permission to remove such a role!");
                });
        else
            return emoji.message.send("A role that was used in the autorole message no longer exists, failed to remove the role.");
    });

    autoRoleCollectors.push(collector);
    autoroleObj.collector = collector;
}

const setEmojiCollectorAll = async function (autoroleObj) {

    let toDelete = [];

    for (let AUTOROLE of autoroleObj) {

        let message;


        //let guldss = await MAIN.Client.guilds.fetch();

        if (!MAIN.Client.guilds.cache.get(AUTOROLE.guildID))
            continue;

        try {
            message = await (await MAIN.Client.guilds.fetch(AUTOROLE.guildID)).channels.cache.get(AUTOROLE.channelID).messages.fetch(AUTOROLE.messageID);
        } catch (err) {

            let guild1 = await MAIN.Client.guilds.fetch(AUTOROLE.guildID);

            if (!guild1) {
                toDelete.push({ guildID: AUTOROLE.guildID, messageID: AUTOROLE.messageID });
                console.log(`GuildName: ${guild1.name} || GuildID: ${AUTOROLE.guildID} || AutoRoleTitle: ${AUTOROLE.title} || Autorole: ${AUTOROLE.messageID} || Issue: guild missing`);
                continue;
            }

            let channel = await guild1.channels.cache.get(AUTOROLE.channelID);
            if (!channel) {
                //channel.send("An autorole message channel! that was here previously has been deleted. Removing it from the database and any restrictions associated with it!");
                toDelete.push({ guildID: AUTOROLE.guildID, messageID: AUTOROLE.messageID });
                console.log(`GuildName: ${guild1.name} || GuildID: ${AUTOROLE.guildID} || AutoRoleTitle: ${AUTOROLE.title} || Autorole: ${AUTOROLE.messageID} || Issue: channel missing`);
                continue;
            }
            if (!message) {
                channel.send("An autorole message that was here previously has been deleted. Removing it from the database and any restrictions associated with it!");
                toDelete.push({ guildID: AUTOROLE.guildID, messageID: AUTOROLE.messageID });
                console.log(`GuildName: ${guild1.name} || GuildID: ${AUTOROLE.guildID} || AutoRoleTitle: ${AUTOROLE.title} || Autorole: ${AUTOROLE.messageID} || Issue: message missing`);
                continue;
            }


            // fs.promises.writeFile(`${23124}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
            // fs.promises.writeFile(`${2222}.json`, JSON.stringify("guildID: " + guild1.id + "\n\n" + "MessageID: " + AUTOROLE.messageID), 'UTF-8');
            // // let guild = await MAIN.findGuild({
            //     id: AUTOROLE.guildID
            // });

            // let index = guild.autorole.findIndex(element => element.messageID == AUTOROLE.messageID)
            // guild.autorole.splice(index);
            // Guild.findOneAndUpdate({
            //     id: guild.id
            // }, {
            //     $set: {
            //         autorole: guild.autorole
            //     }
            // }, function (err, doc, res) { })

            continue;

        }


        if (message.author.id != MAIN.Client.user.id) {

            autoRoleMap.delete(message.id);
            continue;
        }

        setEmojiCollecter(AUTOROLE, message);
    }
    return toDelete;
}

const initialiseAdministrator = async function () {

    let guilds = await MAIN.getGuilds();

    await MAIN.sleep(2500);

    let completeDeleteList = [];

    for (let GUILD of guilds) {
        let guild = GUILD;
        populateAutoRoleMap(guild.autorole);
        let result = await setEmojiCollectorAll(guild.autorole);

        if (result.length > 0) {

            completeDeleteList = completeDeleteList.concat(result);
        }
    }
    console.log(`Length of list: ${completeDeleteList.length}`);
    if (completeDeleteList.length > 0) {

        for (let item of completeDeleteList) {

            console.log(item);

            let guild = await Guild.findOne({ id: item.guildID });

            for (let i = 0; i < guild.autorole.length; i++) {

                let auto = guild.autorole[i];

                if (auto.messageID == item.messageID) {
                    console.log(`found the right auto role at index: ${i}`);
                    auto = null;
                    guild.autorole.splice(i, 1);
                    Guild.findOneAndUpdate({
                        id: guild.id
                    }, {
                        $set: {
                            autorole: guild.autorole
                        }
                    }, function (err, doc, res) {
                        if (err) { console.log(err); return; }
                        // if (doc) { console.log(doc); }
                        // if (res) { console.log(res); }
                    });
                    break;
                }
            }
        }
    }
    setInterval(resetCollectors, 30 * 60 * 1000);
}
exports.initialiseAdministrator = initialiseAdministrator;

const resetCollectors = async function () {

    for (let collector of autoRoleCollectors) {
        collector.resetTimer();
    }
}

const editAutoRoleTitle = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only change an autoRole message's title from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins may change an autoRole message's title");


    let args = message.content.split(" ").slice(1).join(" ").split(',');
    let ID = args[0];
    args.splice(0, 1);
    let title = args.join(',');

    let autoMessage = autoRoleMap.get(ID);



    if (!autoMessage)
        return message.channel.send("I could not find an autorole message of that ID. Please ensure you are sending the ID first, title 2nd (after a comma).");


    let actualAutoMessage = await message.guild.channels.cache.get(autoMessage.channelID).messages.fetch(ID);

    if (actualAutoMessage.author.id != MAIN.Client.user.id) {

        // console.log(actualAutoMessage.author.id)
        // console.log(MAIN.Client.id)

        return message.channel.send("I am not the author of that autorole message! Thus, I cannot modify its title or description!");
    }

    autoMessage.title = title;
    autoMessage.runningEmbed.title = title;

    actualAutoMessage.edit({
        embed: autoMessage.runningEmbed
    });
    updateAutoRoleObject(autoMessage, message.guild.id);
    message.channel.send("Successfuly updated autorole message!");
}
exports.editAutoRoleTitle = editAutoRoleTitle;

const editAutoRoleDescription = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only change an autoRole message's description from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins may change an autoRole message's description");

    let args = message.content.split(" ").slice(1).join(" ").split(',');


    if (args.length < 2)
        return message.channel.send("You have to provide the message ID and the new description seperated by a comma!");


    let ID = args[0];
    args.splice(0, 1);
    let description = args.join(',');

    let autoMessage = autoRoleMap.get(ID);

    if (!autoMessage) {
        return message.channel.send("That ID does not match any known autorole messages!");
    }

    let actualAutoMessage = await message.guild.channels.cache.get(autoMessage.channelID).messages.fetch(ID);

    if (!actualAutoMessage)
        return message.channel.send("It seems like that autorole message no longer exists! It will be deleted from the database soon!");


    if (actualAutoMessage.author.id != MAIN.Client.user.id) {


        return message.channel.send("I am not the author of that autorole message! Thus, I cannot modify its title or description!");
    }

    autoMessage.description = description;
    autoMessage.runningEmbed.description = description;

    actualAutoMessage.edit({
        embed: autoMessage.runningEmbed
    });
    updateAutoRoleObject(autoMessage, message.guild.id);
    message.channel.send("Successfuly updated autorole message!");
}
exports.editAutoRoleDescription = editAutoRoleDescription;


const autorole = async function (message, params, user) {

    if (message.content == '-1')
        return 0;

    if (params.step) {

        params.numMessages++;

        switch (params.step) {

            case 1: //Comes from matcher

                await message.channel.send(`1) Please enter the title for the autorole message (Max. 250 characters):` +
                    "\nThis is what the message currently will look like:");
                await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.numMessages += 2;

                return MAIN.createRunningCommand(message, {
                    command: autorole,
                    commandParams: {
                        ...params,
                        step: 2
                    }
                }, user);
                break;
            case 2:

                if ((message.content.length > 250)) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 2,
                        }
                    }, user);
                } else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed,
                            title: message.content
                        }
                    });
                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 3,
                        title: message.content
                    },
                    {
                        ...params,
                        step: 1
                    }
                    ], autorole, `Do you wish to keep:  **${message.content}**   as the title or change it?`);
                }
                break;
            case 3:

                if (params.title.length > 250) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${params.title.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 1,
                        }
                    }, user);
                } else if (message.content.length <= 1000) {

                    params.runningEmbed.title = params.title;
                    await message.channel.send("\nThis is what the message currently will look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed
                        }
                    });
                    await message.channel.send("`2) Please enter the description for the autorole message (Max. 1000 characters):`");
                    params.numMessages += 3;


                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 4
                        }
                    }, user);
                } else {

                    await message.channel.send("The description is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 4,
                        }
                    }, user);

                }
                break;
            case 4:

                if ((message.content.length > 1000)) {

                    await message.channel.send("The description is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 3,
                        }
                    }, user);
                }
                else if ((message.content.trim().length < 1)) {
                    await message.channel.send("The description has to be at least 1 character! Try again.")
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 3,
                        }
                    }, user);
                }
                else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed,
                            description: message.content
                        }
                    });
                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 5,
                        description: message.content,
                        runningEmbed: {
                            ...params.runningEmbed,
                            description: message.content
                        }
                    },
                    {
                        ...params,
                        step: 3
                    }
                    ], autorole, `Do you wish to keep:  **${message.content}**   as the description or change it?`);
                }
            case 5:

                await message.channel.send("`3) Please enter an emoji and @role to pair seperated by **,** (must be a valid universal emoji or specific to this server!):` " +
                    "```*emoji*, @role```" +
                    "\nThis is what the message currently will look like:");
                let tempy = await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.numMessages += 2;

                if (params.newEmoji) {
                    params.emojis.push(params.newEmoji);
                    params.roles.push(params.newEmoji.roleID);
                    params.newEmoji = null;
                }
                reactEmoji(tempy, params.emojis);

                return MAIN.createRunningCommand(message, {
                    command: autorole,
                    commandParams: {
                        ...params,
                        step: 6,
                    }
                }, user);

                break;
            case 6:

                if (message.content.split(',').length != 2) {

                    await message.channel.send("You made an error in writing the emoji-@role. Refer to the example below!" +
                        "```*emoji*, @role```");
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 6,
                        }
                    }, user);
                } else if (message.mentions.roles.size != 1) {

                    await message.channel.send("You made an error in writing the emoji-@role. Make sure to @mention only 1 role! Refer to the example below!" +
                        "```*emoji*, @role```");
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole,
                        commandParams: {
                            ...params,
                            step: 6,
                        }
                    }, user);
                } else {

                    let args = message.content.split(',');
                    let emoji = args[0].trim();
                    let emojiID = null;
                    let role = message.mentions.roles.first().id;

                    if ((await giveRoleSelf(message, role)) != 1) {

                        await message.channel.send("Please fix my permissions for this role or try a different one.");
                        params.numMessages++;
                        return MAIN.createRunningCommand(message, {
                            command: autorole,
                            commandParams: {
                                ...params,
                                step: 6,
                            }
                        }, user);
                    }


                    if (params.emojis.find(element => element.roleID == role)) {

                        await message.channel.send(MAIN.mentionRole(role) +
                            " is already linked to an emoji in this message! Try again");
                        params.numMessages++;
                        return MAIN.createRunningCommand(message, {
                            command: autorole,
                            commandParams: {
                                ...params,
                                step: 6,
                            }
                        }, user);
                    }

                    let foundEmoji = params.emojis.find(element => element.emoji == emoji);

                    if (foundEmoji) {

                        await message.channel.send(`That emoji is already used for this message! Try again!`);
                        params.numMessages++;
                        return MAIN.createRunningCommand(message, {
                            command: autorole,
                            commandParams: {
                                ...params,
                                step: 6,
                            }
                        }, user);
                    }

                    await message.channel.send("\nThis is what the message currently will look like:");
                    let tempMess = await message.channel.send({
                        embed: {
                            ...params.runningEmbed
                        }
                    });
                    params.numMessages += 2;
                    reactEmoji(tempMess, params.emojis);

                    if (emoji.includes(':')) {

                        let id = emoji.substring(emoji.indexOf(':', 3) + 1, emoji.indexOf('>'));
                        console.log(id);

                        let guildEmoji = message.guild.emojis.cache.get(id);
                        if (!guildEmoji) {

                            await message.channel.send("You entered an invalid emoji, make sure its universal or from this server! Refer to the example below!" +
                                "```*emoji*, @role```");
                            params.numMessages++;
                            return MAIN.createRunningCommand(message, {
                                command: autorole,
                                commandParams: {
                                    ...params,
                                    step: 6,
                                }
                            }, user);
                        }

                        emojiID = id;
                        await tempMess.react(guildEmoji);
                    } else
                        await tempMess.react(emoji);

                    await message.channel.send("Don't worry about the order, they will be fixed in the next step!");
                    params.numMessages += 2; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Add another pair', 'Change last pair', 'finish'], [{
                        ...params,
                        step: 5,
                        newEmoji: {
                            emoji: emoji,
                            roleID: role,
                            emojiID: emojiID
                        }
                    },
                    {
                        ...params,
                        step: 5,
                        newEmoji: null
                    },
                    {
                        ...params,
                        step: 7,
                        newEmoji: {
                            emoji: emoji,
                            roleID: role,
                            emojiID: emojiID
                        }
                    }
                    ], autorole, `Do you wish to add another emoji-role pair, change the previous one or proceed to finalise the message?`);
                }

                break;
            case 7:

                if (params.newEmoji) {
                    params.emojis.push(params.newEmoji);
                    params.roles.push(params.newEmoji.roleID);
                    params.newEmoji = null;
                }


                await message.channel.send("This is what the message currently will look like:");
                let tempy1 = await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                reactEmoji(tempy1, params.emojis);
                params.numMessages += 3; //might cause issues

                return await MAIN.generalMatcher(message, -23, user, ['Unique', 'Permanent', 'Unlimited'], [{
                    ...params,
                    step: 8,
                    unique: true,
                    permenant: false,
                    neither: false
                },
                {
                    ...params,
                    step: 8,
                    unique: false,
                    permenant: true,
                    neither: false
                },
                {
                    ...params,
                    step: 8,
                    unique: false,
                    permenant: false,
                    neither: true
                }
                ], autorole, `What kind of mode should this message enforce?\n` +
                "```" + `\n1) Unique: Limit each user to 1 reaction (they can change their reaction to gain/loose the role` +
                `\n\n2) Permanent: Limit each user to a single reaction for the lifetime of this message. They cannot change their mind after reacting.` +
                `\n\n3) Unlimited: Let everyone react to as many emojis as they want!` + "```");

                break;
            case 8:

                params.numMessages += 1; //might cause issues
                return await MAIN.generalMatcher(message, -23, user, ['Static', 'Not Static'], [{
                    ...params,
                    step: 9,
                    static: true
                },
                {
                    ...params,
                    step: 9,
                    static: false
                }
                ], autorole, `Would you like the message to be static? A static message will remove any other emojis to prevent mass reactions clogging up the message.`);

                break;
            case 9:

                await message.channel.send(`Below you will find the final result!`);
                let finalMessage = await message.channel.send({
                    embed: params.runningEmbed
                });
                params.messageID = finalMessage.id;
                await reactEmoji(finalMessage, params.emojis);
                autoRoleMap.set(finalMessage.id, params);
                setEmojiCollecter(params, finalMessage);
                params.numMessages += 2;

                let guild = await MAIN.findGuild({
                    id: message.guild.id
                });

                guild.autorole.push(params);


                MAIN.cachedGuilds.set(guild.id, guild);

                Guild.findOneAndUpdate({
                    id: message.guild.id
                }, {
                    $set: {
                        autorole: guild.autorole
                    }
                }, function (err, doc, res) { });

                params.numMessages += 1;

                return await MAIN.generalMatcher(message, -23, user, ['Remove Messages', 'Keep Messages'], [{
                    ...params,
                    step: 10,
                    remove: true
                },
                {
                    ...params,
                    step: 10,
                    remove: false
                }
                ], autorole, "Would you like me to delete the previous setup message? Depending on how many mistakes were made, some messages might be left over." +
                " However, only the setup messages will be removed.");


                break;
            case 10:

                if (params.remove) {

                    console.log(`Removing ${params.numMessages} messages!`);

                    // let messages = await message.channel.messages.fetch({ limit: params.numMessages - 1 })
                    let messages = await message.channel.messages.fetch({
                        after: params.originalMessage
                    })
                    console.log(messages.size)
                    messages.delete(params.messageID);
                    console.log(messages.size);



                    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
                    if (!permission.has("MANAGE_MESSAGES")) {

                        params.numMessages += 1;

                        return await MAIN.generalMatcher(message, -23, user, ['Try Again', "Don't Try Again"], [{
                            ...params,
                            step: 10,
                            remove: true
                        },
                        {
                            ...params,
                            step: 10,
                            remove: false
                        }
                        ], autorole, "I don't have the MANAGE_MESSAGES permission in this channel to delete messages. Would you like me to try again?");
                    }

                    message.channel.bulkDelete(messages).catch(err => {
                        console.log("Error deleting bulk messages: " + err);
                        message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
                    });

                }
                break;
        }

    } else {

        if (message.channel.type == 'dm') return message.channel.send("You can only create and autoRole Message from inside a server text channel");

        if (!message.member.permissions.has("ADMINISTRATOR"))
            return message.channel.send("Only admins may create an autorole message");

        await message.channel.send("Welcome to the autorole message creator. This is what the message will currently look like:");

        let embed1 = JSON.stringify(MAIN.Embed)
        embed1.description = 'Temporary Description. This field is required!',
            embed1.footer = ''
        embed1.title = ''
        embed1.timestamp = null
        await message.channel.send({
            embed: embed1
        });
        await message.channel.send("```\n You can enter **-1** at any point to stop the autorole creation process!```")
        await message.channel.send("Please be careful with all your future inputs.\n`Step 1) Please enter the title for the message (Max. 250 characters):`");

        return MAIN.createRunningCommand(message, {
            command: autorole,
            commandParams: {
                step: 2,
                runningEmbed: embed1,
                guildID: message.guild.id,
                channelID: message.channel.id,
                messageID: null,
                title: '',
                description: '',
                emojis: [],
                newEmoji: null,
                users: [],
                roles: [],
                numMessages: 5,
                originalMessage: JSON.parse(JSON.stringify(message.id))
            }
        }, user);
    }
}
exports.autorole = autorole;



const embedCreator = async function (message, params, user) {
    if (message.content == '-1')
        return 0;

    if (params.step) {

        params.numMessages++;

        switch (params.step) {

            case 1: //Comes from matcher

                await message.channel.send(`1) Please enter the title for the embed (Max. 250 characters):` +
                    "\nThis is what the message currently will look like:");
                await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.numMessages += 2;

                return MAIN.createRunningCommand(message, {
                    command: embedCreator,
                    commandParams: {
                        ...params,
                        step: 2
                    }
                }, user);
                break;
            case 2:

                if ((message.content.length > 250)) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 2,
                        }
                    }, user);
                } else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed,
                            title: message.content
                        }
                    });
                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 3,
                        title: message.content
                    },
                    {
                        ...params,
                        step: 1
                    }
                    ], embedCreator, `Do you wish to keep:  **${message.content}**   as the title or change it?`);
                }
                break;
            case 3:

                if (params.title.length > 250) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${params.title.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 1,
                        }
                    }, user);
                } else if (message.content.length <= 1000) {

                    params.runningEmbed.title = params.title;
                    await message.channel.send("\nThis is what the message currently will look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed
                        }
                    });
                    await message.channel.send("`2) Please enter the description for the embed message (Max. 1000 characters):`");
                    params.numMessages += 3;


                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 4
                        }
                    }, user);
                } else {

                    await message.channel.send("The description is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 4,
                        }
                    }, user);

                }
                break;
            case 4:

                if ((message.content.length > 1000)) {

                    await message.channel.send("The description is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 3,
                        }
                    }, user);
                }
                else if ((message.content.trim().length < 1)) {
                    await message.channel.send("The description has to be at least 1 character! Try again.")
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 3,
                        }
                    }, user);
                }
                else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed,
                            description: message.content
                        }
                    });
                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 5,
                        description: message.content,
                        runningEmbed: {
                            ...params.runningEmbed,
                            description: message.content
                        }
                    },
                    {
                        ...params,
                        step: 3
                    }
                    ], embedCreator, `Do you wish to keep:  **${message.content}**   as the description or change it?`);
                }
            case 5:

                if (params.fieldAdded)
                    params.runningEmbed.fields.push(params.newField);

                await message.channel.send("This is what the message currently will look like:");
                let tempy = await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.numMessages += 1;

                return await MAIN.generalMatcher(message, -23, user, ['Add inline field', 'Add seperate line field', 'finish'], [{
                    ...params,
                    step: 6,
                    newField: {
                        inline: true,
                        name: 'temp title (can be blank)',
                        value: 'temp field body (can be blank)'
                    }
                },
                {
                    ...params,
                    step: 6,
                    newField: {
                        inline: false,
                        name: 'temp title (can be blank)',
                        value: 'temp field body (can be blank)'
                    }
                },
                {
                    ...params,
                    step: 9,
                    newField: null
                }
                ], embedCreator, "Do you wish to add a field to your embed?");

                if (params.newEmoji) {
                    params.emojis.push(params.newEmoji);
                    params.roles.push(params.newEmoji.roleID);
                    params.newEmoji = null;
                }
                reactEmoji(tempy, params.emojis);

                return MAIN.createRunningCommand(message, {
                    command: embedCreator,
                    commandParams: {
                        ...params,
                        step: 6,
                    }
                }, user);

                break;
            case 6:

                await message.channel.send(`3) Please enter the title for the field (Max. 250 characters):` +
                    "\nThis is what the message currently will look like:");

                params.runningEmbed.fields.push(params.newField)
                await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.runningEmbed.fields.pop();

                params.numMessages += 2;

                return MAIN.createRunningCommand(message, {
                    command: embedCreator,
                    commandParams: {
                        ...params,
                        step: 7
                    }
                }, user);
                break;
            case 7:

                if ((message.content.length > 250)) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 6,
                        }
                    }, user);
                } else {

                    await message.channel.send("This is what the message will currently look like:");

                    params.newField.name = message.content;

                    params.runningEmbed.fields.push(params.newField)
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed
                        }
                    });
                    params.runningEmbed.fields.pop();

                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 8
                    },
                    {
                        ...params,
                        step: 6
                    }
                    ], embedCreator, `Do you wish to keep:  **${message.content}**   as the title or change it?`);
                }
                break;
            case 8:

                await message.channel.send(`4) Please enter the body for the field (Max. 1000 characters):` +
                    "\nThis is what the message currently will look like:");

                params.runningEmbed.fields.push(params.newField)
                await message.channel.send({
                    embed: {
                        ...params.runningEmbed
                    }
                });
                params.runningEmbed.fields.pop();

                params.numMessages += 2;

                return MAIN.createRunningCommand(message, {
                    command: embedCreator,
                    commandParams: {
                        ...params,
                        step: 11
                    }
                }, user);
                break;
            case 9:

                await message.channel.send(`Below you will find the final result!`);
                let finalMessage = await message.channel.send({
                    embed: params.runningEmbed
                });
                params.messageID = finalMessage.id;
                params.numMessages += 2;

                // MAIN.cachedGuilds.set(guild.id, guild);

                // Guild.findOneAndUpdate({
                //     id: message.guild.id
                // }, {
                //     $set: {
                //         autorole: guild.autorole
                //     }
                // }, function (err, doc, res) { });

                params.numMessages += 1;

                return await MAIN.generalMatcher(message, -23, user, ['Remove Messages', 'Keep Messages'], [{
                    ...params,
                    step: 10,
                    remove: true
                },
                {
                    ...params,
                    step: 10,
                    remove: false
                }
                ], embedCreator, "Would you like me to delete the previous setup message? Depending on how many mistakes were made, some messages might be left over." +
                " However, only the setup messages will be removed.");


                break;
            case 10:

                if (params.remove) {

                    console.log(`Removing ${params.numMessages} messages!`);

                    // let messages = await message.channel.messages.fetch({ limit: params.numMessages - 1 })
                    let messages = await message.channel.messages.fetch({
                        after: params.originalMessage
                    })
                    console.log(messages.size)
                    messages.delete(params.messageID);
                    console.log(messages.size);

                    if (messages.size > 99) {
                        message.channel.send("There are more than 99 messages to delete...not allowed by api. Sorry but you will have to manually delete them.");
                    }


                    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
                    if (!permission.has("MANAGE_MESSAGES")) {

                        params.numMessages += 1;

                        return await MAIN.generalMatcher(message, -23, user, ['Try Again', "Don't Try Again"], [{
                            ...params,
                            step: 10,
                            remove: true
                        },
                        {
                            ...params,
                            step: 10,
                            remove: false
                        }
                        ], embedCreator, "I don't have the MANAGE_MESSAGES permission in this channel to delete messages. Would you like me to try again?");
                    }

                    message.channel.bulkDelete(messages).catch(err => {
                        console.log("Error deleting bulk messages: " + err);
                        message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
                    });

                }
                break;
            case 11: // added extra case to allow fields to be made, loops back into 9 once done
                if ((message.content.length > 1000)) {

                    await message.channel.send("The body is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: embedCreator,
                        commandParams: {
                            ...params,
                            step: 8,
                        }
                    }, user);
                } else {

                    await message.channel.send("This is what the message will currently look like:");

                    params.newField.value = message.content;

                    params.runningEmbed.fields.push(params.newField)
                    await message.channel.send({
                        embed: {
                            ...params.runningEmbed
                        }
                    });
                    params.runningEmbed.fields.pop();

                    params.numMessages += 3; //might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [{
                        ...params,
                        step: 5,
                        fieldAdded: true
                    },
                    {
                        ...params,
                        step: 8
                    }
                    ], embedCreator, `Do you wish to keep:  **${message.content}**   as the title or change it?`);
                }
                break;
                break;
        }

    } else {

        if (message.channel.type == 'dm') return message.channel.send("You can only create and autoRole Message from inside a server text channel");

        if (!message.member.permissions.has("ADMINISTRATOR"))
            return message.channel.send("Only admins may create an autorole message");

        await message.channel.send("Welcome to the custom embed creator. Please note that embeds are limited to a total of **6,000** characters and **25** fields. The prior two restrictions are not enforced and attempting to circumvent them will break things :)\n"
            + "This is what the message will currently look like:");

        let embed1 = JSON.parse(JSON.stringify(MAIN.Embed));
        embed1.description = 'Temporary Description. This field is required!',
            embed1.footer = ''
        embed1.title = 'Temporary Title. This field is required!',
            embed1.timestamp = null

        await message.channel.send({
            embed: embed1
        });
        await message.channel.send("```\n You can enter **-1** at any point to stop the custom embed creation process!```")
        await message.channel.send("Please be careful with all your future inputs.\n`Step 1) Please enter the title for the message (Max. 250 characters):`");

        return MAIN.createRunningCommand(message, {
            command: embedCreator,
            commandParams: {
                step: 2,
                runningEmbed: embed1,
                guildID: message.guild.id,
                channelID: message.channel.id,
                messageID: null,
                title: '',
                description: '',
                emojis: [],
                newEmoji: null,
                users: [],
                roles: [],
                numMessages: 5,
                originalMessage: JSON.parse(JSON.stringify(message.id))
            }
        }, user);
    }
}
exports.embedCreator = embedCreator;


const addAutoRoleRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only change an autoRole message's roles from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins may change an autoRole message's roles");

    let args = message.content.split(" ").slice(1).join(" ").split(',');

    let ID = args[0];

    console.log(`ID: ${ID}`);

    let autoMessage = autoRoleMap.get(ID);

    if (!autoMessage) {
        return message.channel.send("That ID does not match any known autorole messages!");
    }

    let actualAutoMessage = await message.guild.channels.cache.get(autoMessage.channelID).messages.fetch(ID);

    if (!actualAutoMessage)
        return message.channel.send("It seems like that autorole message no longer exists! It will be deleted from the database soon!");


    if (actualAutoMessage.author.id != MAIN.Client.user.id)
        return message.channel.send("I am not the author of that autorole message! Thus, I cannot modify its reactions!");






    let emojiString = message.content.split(',');
    emojiString.splice(0, 1);

    console.log(`emojiString: ${emojiString}`);


    if (emojiString.length != 2)
        return message.channel.send("You made an error in writing the emoji-@role. Refer to the example below!" +
            "```*emoji*, @role```");

    else if (message.mentions.roles.size != 1)
        return message.channel.send("You made an error in writing the emoji-@role. Make sure to @mention only 1 role! Refer to the example below!" +
            "```*emoji*, @role```");

    else {

        let emoji = emojiString[0].trim();
        let emojiID = null;
        let role = message.mentions.roles.first().id;

        if ((await giveRoleSelf(message, role)) != 1)
            return message.channel.send("Please fix my permissions for this role or try a different one.");

        if (autoMessage.emojis.find(element => element.roleID == role))
            await message.channel.send(MAIN.mentionRole(role) +
                " is already linked to an emoji in this message! Try again");



        let foundEmoji = autoMessage.emojis.find(element => element.emoji == emoji);

        if (foundEmoji)
            return message.channel.send(`That emoji is already used for this message! Try again!`);


        if (emoji.includes(':')) {

            let id = emoji.substring(emoji.indexOf(':', 3) + 1, emoji.indexOf('>'));
            console.log(`emojiID: ${id}`);
            emojiID = id;

            let guildEmoji = message.guild.emojis.cache.get(id);
            if (!guildEmoji)
                return message.channel.send("You entered an invalid emoji, make sure its universal or from this server! Refer to the example below!" +
                    "```*emoji*, @role```");
        }


        let finalEmoji = {
            emoji: emoji,
            roleID: role,
            emojiID: emojiID
        }

        //await actualAutoMessage.reactions.removeAll().catch(error => console.error('Failed to clear reactions: ', error));

        autoMessage.emojis.push(finalEmoji);

        await reactEmoji(actualAutoMessage, autoMessage.emojis);

        autoMessage.collector.stop();

        setEmojiCollecter(autoMessage, actualAutoMessage);

        updateAutoRoleObject(autoMessage, message.guild.id);
        message.channel.send("Successfuly added a new reaction/role pair!");
    }
}
exports.addAutoRoleRole = addAutoRoleRole;


const deleteAutoRoleRole = async function (message, params, user) {


    if (message.channel.type == 'dm') return message.channel.send("You can only change an autoRole message's reactions from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins may change an autoRole message's reactions");

    let ID = message.content.split(" ")[1].split(',')[0];

    console.log(`ID: ${ID}`);

    let autoMessage = autoRoleMap.get(ID);

    if (!autoMessage) {
        return message.channel.send("That ID does not match any known autorole messages!");
    }

    let actualAutoMessage = await message.guild.channels.cache.get(autoMessage.channelID).messages.fetch(ID);

    if (!actualAutoMessage)
        return message.channel.send("It seems like that autorole message no longer exists! It will be deleted from the database soon!");


    if (actualAutoMessage.author.id != MAIN.Client.user.id)
        return message.channel.send("I am not the author of that autorole message! Thus, I cannot modify itsreactions!");




    let emoji = message.content.split(',')[1].trim();
    console.log(`emoji: ${emoji}`);

    for (let i = 0; i < autoMessage.emojis.length; i++) {

        if (emoji.includes(':')) {

            let id = emoji.substring(emoji.indexOf(':', 3) + 1, emoji.indexOf('>'));
            console.log(`emojiID: ${id}`);
            console.log(autoMessage.emojis[i].emojiID)

            console.log(autoMessage.emojis[i].emojiID == id)

            if (autoMessage.emojis[i].emojiID == id) {

                actualAutoMessage.reactions.cache.get(id).remove().catch(error => console.error('Failed to remove reactions: ', error));
                autoMessage.emojis.splice(i, 1);
                updateAutoRoleObject(autoMessage, message.guild.id);
                return message.channel.send("Reaction/role pair removed!");
            }
        }
        else if (autoMessage.emojis[i].emoji == emoji) {

            actualAutoMessage.reactions.cache.get(emoji).remove().catch(error => console.error('Failed to remove reactions: ', error));
            autoMessage.emojis.splice(i, 1);
            updateAutoRoleObject(autoMessage, message.guild.id);
            return message.channel.send("Reaction/role pair removed!");
        }
    }

    return message.channel.send("That reaction/role pair was not found for the specified Auto-Role message!");
}
exports.deleteAutoRoleRole = deleteAutoRoleRole;


const updateAutoRoleObject = async function (autoRoleObj, guildID) {

    let guild = await MAIN.findGuild({
        id: guildID
    });

    let index = guild.autorole.findIndex(element => element.messageID == autoRoleObj.messageID)


    let collector = autoRoleObj.collector;

    delete autoRoleObj.collector;

    guild.autorole[index] = autoRoleObj;

    console.log(autoRoleObj);

    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            autorole: guild.autorole
        }
    }, function (err, doc, res) {
        if (err) { console.log(err); return; }
        // if (doc) { console.log(doc); }
        // if (res) { console.log(res); }
    });


    autoRoleObj.collector = collector;

    return 1;
}

const welcomeMessages = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only configure welcome messages from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can configure welcome messages for the server");

    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off");
    }

    if (args == 'on') {
        message.channel.send("Welcome message have been enabled.");
        MAIN.cachedGuilds.get(message.guild.id).welcomeMessages = true;
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                welcomeMessages: true
            }
        }, function (err, doc, res) { });
        return 1;
    }

    message.channel.send("Welcome message have been disabled.");
    MAIN.cachedGuilds.get(message.guild.id).welcomeMessages = false;
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            welcomeMessages: false
        }
    }, function (err, doc, res) { });
    return 1;
}
exports.welcomeMessages = welcomeMessages;


const followYoutuber = async function (message, params, user) {


    let args = message.content.split(" ").slice(1, 2)[0];
    if (!args)
        return message.channel.send("You have to provide the URL of the channel to setup the alerts for!");



    result = await getYoutubeChannelId(args);

    if (result !== false) {
        if (result.error) {
            return message.channel.send("Error getting ID from the provided URL!");
        } else {
            console.log(`Channel ID: ${result.id}`);
        }
    } else {
        return message.channel.send('Invalid youtube channel URL');
    }

    let youtuberID = result.id;
    let youtuber = await ytch.getChannelInfo(youtuberID);
    let vids = await ytch.getChannelVideos(youtuberID);
    let bot = await BOT.findOne();

    let userMap = user.youtubeAlerts;

    if (!userMap) {
        user.youtubeAlerts = new Map();
        userMap = user.youtubeAlerts;
    }

    if (userMap.get(youtuberID))
        return message.channel.send(`You're already following **${youtuber.author}**`);

    userMap.set(youtuberID, vids.items[0].videoId);

    let map = bot.youtubeIDs;

    if (!map.get(youtuberID)) { //Never set a guild before
        let users = {};
        users[user.id] = true;
        map.set(youtuberID, {
            guilds: {},
            users: users
        })
    } else {

        let temp = map.get(youtuberID);
        if (!temp.users[user.id]) { //Never set a youtube alert for this guild for this channel

            let users = {
                ...temp.users
            };
            users[user.id] = true

            temp.users = users;
            map.set(youtuberID, temp);
        }
    }
    BOT.findOneAndUpdate({}, {
        $set: {
            youtubeIDs: map
        }
    }).exec();
    User.findOneAndUpdate({
        id: user.id
    }, {
        $set: {
            youtubeAlerts: user.youtubeAlerts
        }
    }).exec()
    return message.channel.send(`You will now get DMs whenever **${youtuber.author}** posts a new video!`);
}
exports.followYoutuber = followYoutuber;

const viewYoutbeFollows = async function (message, params, user) {

    if (!user.youtubeAlerts)
        return message.channel.send("You're not following any youtube channels!");
    if (user.youtubeAlerts.size == 0)
        return message.channel.send("You're not following any youtube channels!");

    let yArray = [];

    for (let yChannel of user.youtubeAlerts) {

        let youtuber = await ytch.getChannelInfo(yChannel[0]);
        yArray.push({
            name: '',
            value: `**${youtuber.author}**\n`
        })
    }

    return MAIN.prettyEmbed(message, yArray, {
        description: "Here are the Youtube channels you are following:",
        startTally: 1
    });
}
exports.viewYoutbeFollows = viewYoutbeFollows;

const deleteYoutubeFollow = async function (message, params, user) {


    if (!user.youtubeAlerts)
        return message.channel.send("You're not following any youtube channels!");
    if (user.youtubeAlerts.size == 0)
        return message.channel.send("You're not following any youtube channels!");

    let args = message.content.split(" ").slice(1, 2)[0];
    if (!args)
        return message.channel.send("You have to provide the URL of the channel to remove the alerts for!");

    result = await getYoutubeChannelId(args);

    if (result !== false) {
        if (result.error) {
            return message.channel.send("Error getting ID from the provided URL!");
        } else {
            console.log(`Channel ID: ${result.id}`);
        }
    } else {
        return message.channel.send('Invalid youtube channel URL');
    }

    let youtuberID = result.id;
    let youtuber = await ytch.getChannelInfo(youtuberID);

    let start = user.youtubeAlerts.size;
    user.youtubeAlerts.delete(youtuberID);
    console.log(user.youtubeAlerts)
    if (start == user.youtubeAlerts.size)
        return message.channel.send(`Error unfollowing ${youtuber.author}, you weren't following them in the first place!`);

    let bot = await BOT.findOne();
    let botMap = bot.youtubeIDs;
    let actualYoutuber = botMap.get(youtuberID);
    delete actualYoutuber.users[user.id];

    BOT.findOneAndUpdate({}, {
        $set: {
            youtubeIDs: bot.youtubeIDs
        }
    }).exec();
    User.findOneAndUpdate({
        id: user.id
    }, {
        $set: {
            youtubeAlerts: user.youtubeAlerts
        }
    }).exec();
    return message.channel.send(`Succesfuly unfollowed ${youtuber.author}!`);
}
exports.deleteYoutubeFollow = deleteYoutubeFollow;

const youtubeChannelPair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command can only be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can setup youtube alerts for the server");


    let args = message.content.split(" ").slice(1, 2)[0];
    if (!args)
        return message.channel.send("You have to provide the URL of the channel to setup the alerts for!");

    if (message.mentions.channels.size != 1)
        return message.channel.send("You have to #mention exactly 1 channel to include the youtube alerts in!");


    result = await getYoutubeChannelId(args);

    if (result !== false) {
        if (result.error) {
            return message.channel.send("Error getting ID from the provided URL! Make sure you provided the **CHANNEL** url, and not the `user` url!");
        } else {
            console.log(`Channel ID: ${result.id}`);
        }
    } else {
        return message.channel.send('Invalid youtube channel URL');
    }

    let channelID = message.mentions.channels.first().id;
    let youtuberID = result.id;
    let youtuber = await ytch.getChannelInfo(youtuberID);
    let vids = await ytch.getChannelVideos(youtuberID);


    let bot = await BOT.findOne();

    if (!bot.youtubeIDs) {
        let mappy = new Map();
        bot.youtubeIDs = mappy;
    }

    let map = bot.youtubeIDs;

    let guildID = message.guild.id;



    let guild = await MAIN.findGuild({
        id: guildID
    });
    if (!guild.youtubeAlerts) {
        let mappy = new Map();
        guild.youtubeAlerts = mappy;
    }

    let guildMap = guild.youtubeAlerts;

    if (!guildMap.get(youtuberID)) {
        guildMap.set(youtuberID, [
            [channelID, vids.items[0].videoId]
        ]);
    } else {

        for (let pair of guildMap.get(youtuberID))
            if (pair[0] == channelID)
                return message.channel.send("This pair already exists!");

        let arr = guldMap.get(youtuberID);
        arr.push([
            [channelID, vids.items[0].videoId]
        ])
    }



    //The massive amount of checks before ensure that I don't need to repeat this for the
    if (!map.get(youtuberID)) { //Never set a guild before
        let guilds = {};
        guilds[guildID] = true;
        map.set(youtuberID, {
            guilds: guilds,
            users: {}
        })
    } else {

        let temp = map.get(youtuberID);
        if (!temp.guilds[guildID]) { //Never set a youtube alert for this guild for this channel

            let guilds = {
                ...temp.guilds
            };
            guilds[guildID] = true

            temp.guilds = guilds;
            map.set(youtuberID, temp);
        }
    }


    BOT.findOneAndUpdate({}, {
        $set: {
            youtubeIDs: map
        }
    }).exec();
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            youtubeAlerts: guild.youtubeAlerts
        }
    }).exec();
    return message.channel.send(`${MAIN.mentionChannel(message.mentions.channels.first().id)} will now have post alerts whenever **${youtuber.author}** posts a new video!`);
}
exports.youtubeChannelPair = youtubeChannelPair;

const viewYoutubeChannelPairs = async function (message, params, user) {

    let guild = await Guild.findOne({
        id: message.guild.id
    });

    let yArray = [];


    if (!guild.youtubeAlerts)
        return message.channel.send("There are no youtube-channel pairs for this server!");
    if (guild.youtubeAlerts.size == 0)
        return message.channel.send("There are no youtube-channel pairs for this server!");

    for (let yChannel of guild.youtubeAlerts) {

        let tChannels = yChannel[1]; //Array containing the channelID, last vid
        let youtuber = await ytch.getChannelInfo(yChannel[0]);

        for (let tChannel of tChannels)
            yArray.push({
                name: '',
                value: `${MAIN.mentionChannel(tChannel[0])} is linked to **${youtuber.author}**\n`
            })

    }

    return MAIN.prettyEmbed(message, yArray, {
        description: "Here are the ServerChannel-Youtuber pairs:",
        startTally: 1
    });
}
exports.viewYoutubeChannelPairs = viewYoutubeChannelPairs;

const deleteYoutubeChannelPair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command can only be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove youtube alerts for the server");

    let guild = await Guild.findOne({
        id: message.guild.id
    });

    if (!guild.youtubeAlerts)
        return message.channel.send("There are no youtube-channel pairs for this server!");
    if (guild.youtubeAlerts.size == 0)
        return message.channel.send("There are no youtube-channel pairs for this server!");

    let args = message.content.split(" ").slice(1, 2)[0];
    if (!args)
        return message.channel.send("You have to provide the URL of the channel to remove the alerts for!");

    if (message.mentions.channels.size != 1)
        return message.channel.send("You have to #mention exactly 1 channel to remove the youtube alerts from!");


    result = await getYoutubeChannelId(args);

    if (result !== false) {
        if (result.error) {
            return message.channel.send("Error getting ID from the provided URL!");
        } else {
            console.log(`Channel ID: ${result.id}`);
        }
    } else {
        return message.channel.send('Invalid youtube channel URL');
    }

    let channelID = message.mentions.channels.first().id;
    let youtuberID = result.id;
    let youtuber = await ytch.getChannelInfo(youtuberID);

    let i = 0;
    let x = 0
    for (let yChannel of guild.youtubeAlerts) {
        x = 0;

        //yChannel[0] = actual youtuber (id)
        let tChannels = yChannel[1]; //Array containing the channelID, last vid

        for (let tChannel of tChannels) {

            if ((tChannel[0] == channelID) && (yChannel[0] == youtuberID)) {

                tChannels.splice(x, 1); //Remove pair from guild
                if (tChannels.length == 0) { //If it was last pair, remove it from map channel altogether
                    guild.youtubeAlerts.delete(yChannel[0]);


                    let bot = await BOT.findOne();
                    let botMap = bot.youtubeIDs;
                    let actualYoutuber = botMap.get(yChannel[0]);
                    delete actualYoutuber.guilds[guild.id];

                    BOT.findOneAndUpdate({}, {
                        $set: {
                            youtubeIDs: bot.youtubeIDs
                        }
                    }).exec();
                }

                Guild.findOneAndUpdate({
                    id: message.guild.id
                }, {
                    $set: {
                        youtubeAlerts: guild.youtubeAlerts
                    }
                }).exec();
                return message.channel.send(`${MAIN.mentionChannel(tChannel[0])} is no longer linked to **${youtuber.author}**\n`)
            }
            x++;
        }
        i++;
    }
    return message.channel.send("No such pair was found! Try again?");
}
exports.deleteYoutubeChannelPair = deleteYoutubeChannelPair;


const passwordLockRole = async function (message, params, user) {

    if (params.step) {

        let guild = await MAIN.findGuild({
            id: params.guildID
        });
        if (!guild.passwordLock)
            guild.passwordLock = new Map();

        switch (params.step) {

            case 1:

                let pass = message.content;

                if (guild.passwordLock.get(pass)) {

                    message.channel.send("That password is already used! Try another one.");


                    return MAIN.createRunningCommand(message, {
                        command: passwordLockRole,
                        commandParams: params,
                        DM: true
                    }, user);
                } else if ((await giveRoleSelf(params.generalMessage, params.roleID)) != 1) {

                    await message.channel.send("I can't give or remove this role. Please fix my permissions or try a different role.");
                    return MAIN.createRunningCommand(message, {
                        command: passwordLockRole,
                        commandParams: params,
                        DM: true
                    }, user);
                } else {

                    guild.passwordLock.set(pass, params.roleID);
                    MAIN.cachedGuilds.set(params.guildID, guild);
                    Guild.findOneAndUpdate({
                        id: params.guildID
                    }, {
                        $set: {
                            passwordLock: guild.passwordLock
                        }
                    }, function (err, doc, res) { });
                    message.channel.send(`To have a member be assigned your chosen role, have them Direct Message me the following password: sa!activatePasswordRole ${params.guildID}, ${pass}`);
                    return 0;
                }
                break;
        }
    }


    if (message.channel.type == 'dm') return message.channel.send("You can only start the password-role from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can configure the password-role for the server");

    //const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if (message.mentions.roles.size != 1)
        return message.channel.send("You can only @mention a single role to password lock at a time.")


    params = {
        step: 1,
        roleID: message.mentions.roles.first().id,
        guildID: message.guild.id,
        generalMessage: message
    }

    if ((await giveRoleSelf(message, params.roleID)) != 1) {

        await message.channel.send("I can't give or remove this role. Please fix my permissions or try a different role.");
        return MAIN.createRunningCommand(message, {
            command: passwordLockRole,
            commandParams: params
        }, user);
    }

    let messy = await message.author.send("Please enter the password you would like to use:");
    params.dm = messy;

    return MAIN.createRunningCommand(messy, {
        command: passwordLockRole,
        commandParams: params,
        DM: true
    }, user);
}
exports.passwordLockRole = passwordLockRole;

const activatePasswordRole = async function (message, params, user) {

    if (message.channel.type != 'dm')
        return message.channel.send("This command can only be used in my Direct Messages! Try DM'ing me.");

    let args = message.content.split(" ").slice(1).join(" ").trim().split(',');

    if (args.length != 2)
        return message.channel.send("Invalid password");

    let guild = await MAIN.findGuild({
        id: args[0]
    });
    if (!guild)
        return message.channel.send("Invalid password");

    if (!guild.passwordLock)
        return message.channel.send("Invalid password");


    let roleID = guild.passwordLock.get(args[1].trim());

    if (!roleID)
        return message.channel.send("Invalid password");

    let properGuild = await MAIN.Client.guilds.fetch(args[0]);
    let guildMember = properGuild.members.cache.get(message.author.id);
    let role = properGuild.roles.cache.get(roleID);
    guildMember.roles.add(role);

    return message.channel.send("Role given!");
}
exports.activatePasswordRole = activatePasswordRole;

const viewPasswordLockRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can view the password-roleID pairs for the server");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.passwordLock)
        return message.author.send("There are no password-roleID pairs for this server");

    let messy = await message.author.send("Here are all the password-roleID pairs");

    array = Array.from(guild.passwordLock, ([name, value]) => (`${name} - **@${message.guild.roles.cache.get(value).name}**`));

    if (array.length == 0)
        messy.channel.send("There are no password-role pairs for that server!");

    MAIN.prettyEmbed(messy, array, {
        startTally: 1
    });
}
exports.viewPasswordLockRole = viewPasswordLockRole;

const deletePasswordLockRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can delete password-roleId's for the server");

    const args = message.content.split(" ").slice(1).join(" ").trim();

    if (!args)
        return message.channel.send("You have to provide a password to delete the pair for!");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.passwordLock)
        return message.author.send("There are no password-roleID pairs for this server");

    if (!guild.passwordLock.get(args))
        return message.channel.send("I didn't find any password-pair for that password!");

    guild.passwordLock.delete(args);
    console.log(guild.passwordLock);

    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            passwordLock: guild.passwordLock
        }
    }, function (err, doc, res) { });
    return message.channel.send(`Successfuly deleted the password-roleID!`);
}
exports.deletePasswordLockRole = deletePasswordLockRole;


const repScore = async function (message, perams, user) {

    if (message.mentions.users.size != 1)
        return message.channel.send(`You have to @mention only 1 user!`);

    return message.channel.send(`${MAIN.mention(message.mentions.users.first().id)} has ${(await changeRep(
        (await MAIN.findUser(message.mentions.members.first())),
        message.guild.id, 0, message))} rep!`);
}
exports.repScore = repScore;

const addRep = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can grant rep for the server");

    const args = Number(message.content.split(" ").slice(1).join(" ").trim().split(' ')[0]);

    if (!args)
        return message.channel.send("Please write the rep amount first!");
    if (isNaN(args))
        return message.channel.send("That's not a valid number of rep to give!");

    if (message.mentions.users.size != 1)
        return message.channel.send("You can/have to only @mention a single user!");

    let userID = message.mentions.users.first().id;
    let editUser = await MAIN.findUser(message.mentions.members.first(), true);

    try {

        let guild = await MAIN.findGuild({
            id: message.guild.id
        });
        if (guild.thankerMessageChannel.length > 0) {

            let newRep = (await changeRep(editUser, message.guild.id, args, message));

            for (let channy of guild.thankerMessageChannel) {

                let channel = message.guild.channels.cache.get(channy);
                if (channel)
                    channel.send(`Gave ${MAIN.mention(userID)} ${args} rep! They are now at ${newRep}`);
            }
            return guild.thankerMessageChannel.length > 0;
        }

        return message.channel.send(`Gave ${MAIN.mention(userID)} ${args} rep! They are now at ${(await changeRep(editUser, message.guild.id, args, message))}`);
    } catch (err) {
        console.log(err)
        console.log("blacklisted")
    }
}
exports.addRep = addRep;

const removeRep = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove rep for the server");

    const args = Number(message.content.split(" ").slice(1).join(" ").trim().split(' ')[0]);

    if (!args)
        return message.channel.send("Please write the rep amount first!");
    if (isNaN(args))
        return message.channel.send("That's not a valid number of rep to remove!");

    if (message.mentions.users.size != 1)
        return message.channel.send("You can/have to only @mention a single user!");

    let userID = message.mentions.users.first().id;
    let editUser = await MAIN.findUser(message.mentions.members.first());

    try {
        let guild = await MAIN.findGuild({
            id: message.guild.id
        });
        if (guild.thankerMessageChannel.length > 0) {

            for (let channy of guild.thankerMessageChannel) {

                let channel = message.guild.channels.cache.get(channy);
                if (channel)
                    channel.send(`Gave ${MAIN.mention(userID)} ${args} rep! They are now at ${(await changeRep(editUser, message.guild.id, args, message))}`);
            }
            return guild.thankerMessageChannel.length > 0;
        }
        return message.channel.send(`Took away ${MAIN.mention(userID)} ${args} rep! They are now at ${(await changeRep(editUser, message.guild.id, args * -1, message))}`);
    } catch (err) {
        console.log(err)
        console.log('second blacklisted')
    }
}
exports.removeRep = removeRep;

const changeRep = async function (user, guildID, amount, message) {

    let dbGuild = await MAIN.findGuild({
        id: guildID
    });
    // console.log(dbGuild)
    let actualGuild = await MAIN.Client.guilds.cache.get(guildID);

    let guildMember = actualGuild.members.cache.get(user.id);

    if (amount > 0) {

        for (let roleID of dbGuild.blacklistedRepRoles) {

            if (guildMember.roles.cache.keyArray().includes(roleID)) {
                // message.channel.send(`${MAIN.mention(guildMember.id)} is blacklisted from receiving rep!`);
                throw ('Blacklisted boi')
                return -1;
            }
        }
    }

    if (!user.reps) {

        user.reps = new Map();

        user.reps.set(guildID, Number(amount));

        checkRepThreshold(user.id, Number(amount), dbGuild, actualGuild);

        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();
        return user.reps.get(guildID);
    }

    let rep = user.reps.get(guildID);

    if (!rep) {

        user.reps.set(guildID, Number(amount));

        checkRepThreshold(user.id, Number(amount), dbGuild, actualGuild);

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

        // console.log(`The values: ${Number(rep)} AND ${Number(amount)}`);

        user.reps.set(guildID, Number(rep) + Number(amount));

        checkRepThreshold(user.id, Number(rep) + Number(amount), dbGuild, actualGuild);
        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                reps: user.reps
            }
        }).exec();
    }
    return user.reps.get(guildID);
}
exports.changeRep = changeRep;

const blacklistRepRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can create blacklisted rep roles for the server");

    if (message.mentions.roles.size != 1)
        return message.channel.send("Only 1 @role must be mentioned.");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let roleID = message.mentions.roles.first().id;

    if (guild.blacklistedRepRoles.includes(roleID))
        return message.channel.send("This role is already blacklisted for receiving rep!");

    guild.blacklistedRepRoles.push(roleID);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            blacklistedRepRoles: guild.blacklistedRepRoles
        }
    }).exec();
    message.channel.send("Role has been blacklisted for receiving rep!");
}
exports.blacklistRepRole = blacklistRepRole;

const removeBlacklistedRepRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove blacklisted rep roles for the server");

    if (message.mentions.roles.size != 1)
        return message.channel.send("Only 1 @role must be mentioned.");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let roleID = message.mentions.roles.first().id;

    if (!guild.blacklistedRepRoles.includes(roleID))
        return message.channel.send("This role already not blacklisted for receiving rep!");


    console.log(guild.blacklistedRepRoles)

    guild.blacklistedRepRoles.splice(guild.blacklistedRepRoles.indexOf(roleID));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            blacklistedRepRoles: guild.blacklistedRepRoles
        }
    }).exec();
    message.channel.send("Role is no longer blacklisted for receiving rep!");
}
exports.removeBlacklistedRepRole = removeBlacklistedRepRole;


const blacklistGiveRepRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can create blacklisted rep roles for the server");

    if (message.mentions.roles.size != 1)
        return message.channel.send("Only 1 @role must be mentioned.");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let roleID = message.mentions.roles.first().id;

    if (guild.blacklistedGiveRepRoles.includes(roleID))
        return message.channel.send("This role is already blacklisted for giving rep!");

    guild.blacklistedGiveRepRoles.push(roleID);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            blacklistedGiveRepRoles: guild.blacklistedGiveRepRoles
        }
    }).exec();
    message.channel.send("Role has been blacklisted for giving rep!");
}
exports.blacklistGiveRepRole = blacklistGiveRepRole;

const removeBlacklistedGiveRepRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove blacklisted rep roles for the server");

    if (message.mentions.roles.size != 1)
        return message.channel.send("Only 1 @role must be mentioned.");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let roleID = message.mentions.roles.first().id;

    if (!guild.blacklistedGiveRepRoles.includes(roleID))
        return message.channel.send("This role already not blacklisted for giving rep!");


    console.log(guild.blacklistedGiveRepRoles)

    guild.blacklistedGiveRepRoles.splice(guild.blacklistedGiveRepRoles.indexOf(roleID));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            blacklistedGiveRepRoles: guild.blacklistedGiveRepRoles
        }
    }).exec();
    message.channel.send("Role is no longer blacklisted for giving rep!");
}
exports.removeBlacklistedGiveRepRole = removeBlacklistedGiveRepRole;

const checkRepThreshold = async function (userID, value, dbGuild, actualGuild) {

    let maxRole = null;
    let removeRoles = [];

    for (let pair of dbGuild.repRolePairs) {
        // console.log(`testing: ${pair.rep}`)
        if (value >= pair.rep) { //Finding the highest role the user is eligble for
            if (maxRole) {

                if (pair.rep > maxRole.rep) {//Current role is higher than prevMax, store previous max to delete and mark current as max

                    removeRoles.push(maxRole.roleID);
                    maxRole = pair;
                }
                else //otherwise just try to remove the current one
                    removeRoles.push(pair.roleID)
            }
            else
                maxRole = pair;
        }
    }


    if (maxRole) {
        // console.log('updated max role')
        // console.log(maxRole)
        actualGuild = await actualGuild.fetch();

        actualGuild.members.cache.get(userID).roles.add(actualGuild.roles.cache.get(maxRole.roleID));
    }

    if (dbGuild.prevRoleRemove)
        for (let i = 0; i < removeRoles.length; i++) {
            // console.log(`trying to remove: ${removeRoles[i]}`)
            actualGuild.members.cache.get(userID).roles.remove(actualGuild.roles.cache.get(removeRoles[i]))
                .catch((error) => {
                    return;//If we can't remove it, ah well
                });
        }
}


const welcomeMessage = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set the welcome message for new users!");

    const args = message.content.split(" ").slice(1).join(" ").trim();

    if (!args) {

        message.channel.send("You must provide a message to send to new members, or **-1** to disable this feature.");
    }

    let guild = MAIN.cachedGuilds.get(message.guild.id);
    guild.welcomeMessage = args;
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: guild.id
    }, {
        $set: {
            welcomeMessage: guild.welcomeMessage
        }
    }).exec();
    message.channel.send(`New users will receive the following message:\n${args}`);
}
exports.welcomeMessage = welcomeMessage;

const topRep = async function (message, params, user) {

    let args = Number(message.content.split(" ").slice(1).join(" ").trim());

    if (isNaN(args)) {
        return message.channel.send(`You have provided an invalid number of top users to display! Or don't pass any value for a default top 10`);
    }

    let limit = args ? args : 10;


    let parsed = await MAIN.sendToServer({
        command: 'topRep',
        params: [message.guild.id, message.channel.id, limit]
    });

    // if (parsed.status) {
    //     if (parsed.status == -1) {
    //         message.channel.send("I could not find that player+platform combination, try again?");
    //         result = -1;
    //     }
    //     else {
    //         message.channel.send("Such a ServerChannel - Player pair already exists!");
    //         result = -2;
    //     }
    // }
    // else {
    //     Guild.findOneAndUpdate({ id: guild.id }, { $set: { RLTracker: parsed.RLTracker } }, function (err, doc, res) { if (err) console.log(err) });
    //     message.channel.send(`Successfully paired ${args[0]} with <#${ID}>`);
    //     status = 1;
    // }

    // MAIN.prettyEmbed(message, finalString, { modifier: 'xl', title: `Below are the top ${limit} rep'ed users of ${originalLength} who have > 0 rep!` });
}
exports.topRep = topRep;



const repToFaction = async function (message, params, user) {

    if (isNaN(params[0])) {
        return message.channel.send(`You have provided an invalid number for ratio for rep to faction contribution conversion!`);
    }

    let parsed = await MAIN.sendToServer({
        command: 'repToFaction',
        params: [message.guild.id, message.channel.id, params[0]]
    });
}
exports.repToFaction = repToFaction;


const resetFactionPoints = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can reset the faction points");

    let guild = await Guild.findOne({ id: message.guild.id }).exec();

    for (let faction of guild.factions) {

        faction.points = 0;
        faction.contributions.general = 0;
        faction.contributions.newMembers = 0;

        for (let member of faction.contributions.members) {

            if ((!member.legacyPoints) || (member.legacyPoints === NaN))
                member.legacyPoints = 0;

            member.legacyPoints += member.points;
            member.points = 0;
        }
    }

    Guild.findOneAndUpdate({ id: guild.id }, { $set: { factions: guild.factions } }).exec();
    message.channel.send("Succesfully reset faction points");
}
exports.resetFactionPoints = resetFactionPoints;


const identifyThanks = function (message) {

    if ((message.mentions.members.size > 3) || (message.mentions.members.size == 0))
        return false;

    let quoteCheck = message.content.split('\n');

    let messageContent = message.content.toLowerCase();
    if (quoteCheck.length > 1) {

        for (let i = 0; i < quoteCheck.length; i++) {
            let check = quoteCheck[i];
            if (check[0] == '>')
                if (check[1] == ' ')
                    quoteCheck[i] = -1;
        }

        while (quoteCheck.includes(-1))
            quoteCheck.splice(quoteCheck.indexOf(-1), 1)

        messageContent = quoteCheck.join(' ').toLowerCase();
    }

    let thanks = [
        'thanks', 'thank you', ' ty ', 'tyvm', 'thx', 'tank u', 'thank u', 'thank yo', 'thank yu', 'tank yu'
    ]


    if (message.content.substring(0, 2).toLowerCase() == 'ty')
        if (message.content[2] == ' ')
            return true;

    for (let string of thanks) {

        if (messageContent.includes(string))
            return true;
    }
    return false;
}
exports.identifyThanks = identifyThanks;

function setThankerAutoRep(message, params, user) {


    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can disable/enable automatic rep from image/link thanks.");

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false!");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == "TRUE") {

        MAIN.cachedGuilds.get(message.guild.id).thankerAutoRep = true;
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                thankerAutoRep: true
            }
        }, function (err, doc, res) { });
        message.channel.send("Rep will be automatically gained from channel thankers!");
        return 1;
    } else if (bool == "FALSE") {

        MAIN.cachedGuilds.get(message.guild.id).thankerAutoRep = false;
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                thankerAutoRep: false
            }
        }, function (err, doc, res) { });
        message.channel.send("Rep will not be automatically gained from channel thankers!");
        return 1;
    } else {
        message.channel.send("You must enter either true or false: **" + prefix + "setThankerAutoRep** *true/false*");
        return -1;
    }
}
exports.setThankerAutoRep = setThankerAutoRep;

async function setImageForwarding(message, params, user) {


    let prefix = await MAIN.getPrefix(message, user);

    if (message.channel.type == 'dm') return message.channel.send("This command must be called from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can disable/enable image scanning to forward.");

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + "setImageForwarding** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();

    if (bool == "TRUE") {


        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                forwardImages: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res)
        });
        message.channel.send("Images will be automatically be forwarded to imageChannel!");
        return 1;
    } else if (bool == "FALSE") {

        // MAIN.cachedGuilds.get(message.guild.id).forwardImages = false;
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                forwardImages: false
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res)
        });
        message.channel.send("Images will not be automatically be forwarded to imageChannel!");
        return 1;
    } else {
        message.channel.send("You must enter either true or false: **" + prefix + "setImageForwarding** *true/false*");
        return -1;
    }
}
exports.setImageForwarding = setImageForwarding;




const setImageChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel to have images forwarded to it from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel to have images forwarded to it")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.channelImage.includes(message.channel.id)) {

        return message.channel.send("This channel is already having images forwarded to it");
    }

    guild.channelImage.push(message.channel.id);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImage: guild.channelImage
        }
    }).exec();
    return message.channel.send("This channel will now have images forwarded to it");
}
exports.setImageChannel = setImageChannel;

const unSetImageChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel to have images forwarded to it from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel to have images forwarded to it")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelImage.includes(message.channel.id)) {

        return message.channel.send("This channel is already not being monitered for links/images!");
    }

    //  console.log(guild.channelThanker.indexOf(message.channel.id))

    guild.channelImage.splice(guild.channelImage.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImage: guild.channelImage
        }
    }).exec();
    return message.channel.send("This channel will no longer have images forwarded to it");
}
exports.unSetImageChannel = unSetImageChannel;

const forwardImages = async function (message, guild, user) {

    if (message.attachments.size > 0)
        for (let attachment of message.attachments.values())
            if (isImageUrl(attachment.attachment)) {

                let guildy = MAIN.Client.guilds.cache.get(guild.id);

                for (let imageChan of guild.channelImage) {

                    await MAIN.sleep(2000);
                    await guildy.channels.cache.get(imageChan).send(`Image from ${MAIN.mention(message.author.id)}:\n${attachment.attachment}`);
                }
            }
            else if (isVideo(attachment.attachment)) {

                let guildy = MAIN.Client.guilds.cache.get(guild.id);
                for (let imageChan of guild.channelImage) {

                    await MAIN.sleep(2000);
                    await guildy.channels.cache.get(imageChan).send(`Video from ${MAIN.mention(message.author.id)}:\n${attachment.attachment}`);
                }
            }
    const args = message.content.trim().replace(/[\n\r]/g, " ").split(' ');


    for (let string of args)
        if (isImageUrl(string)) {

            let result = await needle('get', string)
                .catch(err => {
                    console.log("caught thanker error forward images")
                });
            if (result) {
                let guildy = MAIN.Client.guilds.cache.get(guild.id);
                for (let imageChan of guild.channelImage) {
                    await MAIN.sleep(2000);
                    await guildy.channels.cache.get(imageChan).send(`Image from ${MAIN.mention(message.author.id)}:\n${string}`);
                }
            }
        }
}
exports.forwardImages = forwardImages;



const setImageSourceChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a channel to be scanned for images to forward to it from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a channel to be scanned for images to forward")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.channelImageSource.includes(message.channel.id)) {

        return message.channel.send("This channel is already being scanned for images to forward");
    }

    guild.channelImageSource.push(message.channel.id);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImageSource: guild.channelImageSource
        }
    }).exec();
    return message.channel.send("This channel will now be scanned for images to forward");
}
exports.setImageSourceChannel = setImageSourceChannel;

const unSetImageSourceChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only unSet a channel to be scanned for images to forward to it from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set unSet a channel to be scanned for images to forward")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.channelImageSource.includes(message.channel.id)) {

        return message.channel.send("This channel is already not being monitered for images!");
    }

    //  console.log(guild.channelThanker.indexOf(message.channel.id))

    guild.channelImageSource.splice(guild.channelImageSource.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            channelImageSource: guild.channelImageSource
        }
    }).exec();
    return message.channel.send("This channel will no longer be scanned for images to forward");
}
exports.unSetImageSourceChannel = unSetImageSourceChannel;



const setGameRolePair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a game - role Pair from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a game - role Pair");

    const args = message.content.split(' ').slice(1).join(' ').trim().split(',');

    if (args.length != 2)
        return message.channel.send("You must specify a game title and a role **seperated by a comma**!");

    if (message.mentions.roles.size != 1)
        return message.channel.send("You can/have to only @mention a single role!");

    let roleID = message.mentions.roles.first().id;

    let test = await giveRoleSelf(message, roleID);

    if (!test)
        return message.channel.send("I don't have the permissions to work with that role!");

    let editGuild = await MAIN.findGuild({ id: message.guild.id });

    let gameRolePair = editGuild.gameRolePair;

    if (!gameRolePair) gameRolePair = {};

    console.log(gameRolePair);
    console.log(args[0]);
    // console.log(gameRolePair[`${args[0]}`]);

    if (!gameRolePair) {

        gameRolePair[`${args[0]}`] = roleID;
        console.log(`after editS:::`);
        console.log(gameRolePair)
    }
    else if (!gameRolePair[`${args[0]}`]) {

        gameRolePair[`${args[0]}`] = roleID;
        Guild.findOneAndUpdate({ id: editGuild.id }, { $set: { gameRolepair: gameRolePair } }, function (err, doc, res) {
            if (err) console.log(err);
            if (res) console.log(res);
        });
        message.channel.send(`Successfuly set game-role pair!`);
    }
    else
        return message.channel.send("Overwriting the previous role assigned to this game!");
}
exports.setGameRolePair = setGameRolePair;

const setRepRolePair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a rep point - role Pair from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a rep point - role Pair");

    const args = Number(message.content.split(" ").slice(1).join(" ").trim().split(' ')[0]);

    if (!args)
        return message.channel.send("Please write the rep amount first!");
    if (isNaN(args))
        return message.channel.send("That's not a valid number of rep to give!");

    if (message.mentions.roles.size != 1)
        return message.channel.send("You can/have to only @mention a single role!");


    let roleID = message.mentions.roles.first().id;

    let test = await giveRoleSelf(message, roleID);

    if (!test)
        return message.channel.send("I don't have the permissions to work with that role!");

    let editGuild = await MAIN.findGuild({
        id: message.guild.id
    });

    let prevPair = editGuild.repRolePairs.find(element => element.roleID == roleID);

    if (prevPair) {

        prevPair.rep = args;
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                repRolePairs: editGuild.repRolePairs
            }
        }).exec();
        return message.channel.send(`Overwriting the previous ${prevPair.rep} rep limit for this role to ${args}`);
    }

    editGuild.repRolePairs.push({
        roleID: roleID,
        rep: args
    });
    MAIN.cachedGuilds.set(message.guild.id, editGuild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            repRolePairs: editGuild.repRolePairs
        }
    }).exec();
    return message.channel.send(`${MAIN.mentionRole(roleID)} will now be granted to members >= ${args} rep!`);
}
exports.setRepRolePair = setRepRolePair;

const removeRepRolePair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a rep point - role Pair from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a rep point - role Pair")

    if (message.mentions.roles.size != 1)
        return message.channel.send("You can/have to only @mention a single role!");


    let roleID = message.mentions.roles.first().id;
    let editGuild = await MAIN.findGuild({
        id: message.guild.id
    });

    let prevPair = editGuild.repRolePairs.find(element => element.roleID == roleID);
    if (!prevPair)
        return message.channel.send("That role didn't have a rep limit associated with it!");


    editGuild.repRolePairs.splice(editGuild.repRolePairs.indexOf(prevPair));
    MAIN.cachedGuilds.set(message.guild.id, editGuild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            repRolePairs: editGuild.repRolePairs
        }
    }).exec();
    message.channel.send("The role has been removed from the rep autorole!");
}
exports.removeRepRolePair = removeRepRolePair;

const setCommandChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only add a whitelisted channel for bot commands from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can whitelist a channel for bot commands")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");

    if (message.mentions.channels.size != 1)
        return message.channel.send("You have to #mention exactly 1 channel to add to the whitelist");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let channelID = message.mentions.channels.first().id;

    if (guild.commandChannelWhiteList.includes(channelID)) {

        return message.channel.send("This channel is already whitelisted for commands");
    }

    guild.commandChannelWhiteList.push(channelID);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            commandChannelWhiteList: guild.commandChannelWhiteList
        }
    }).exec();
    return message.channel.send(`${MAIN.mentionChannel(channelID)}` + " is now whitelisted for commands");
}
exports.setCommandChannel = setCommandChannel;

const unSetCommandChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only remove a channel from bot commands whitelister from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove a whitelisted bot command channel")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.commandChannelWhiteList.includes(message.channel.id)) {

        return message.channel.send("This channel is already not whitelisted for commands");
    }

    guild.commandChannelWhiteList.splice(guild.commandChannelWhiteList.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            commandChannelWhiteList: guild.commandChannelWhiteList
        }
    }).exec();
    return message.channel.send("This channel will no longer be whitelisted for bot commands!");
}
exports.unSetCommandChannel = unSetCommandChannel;





const setThankerLogChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only add a thanker log channel from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can add a thanker log channel")

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
    if (!permission.has("SEND_MESSAGES"))
        return message.author.send("I don't have the right permissions to send messages in this channel!");

    if (message.mentions.channels.size != 1)
        return message.channel.send("You have to #mention exactly 1 channel to add to make the log channel");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let channelID = message.mentions.channels.first().id;

    if (guild.thankerMessageChannel.includes(channelID)) {

        return message.channel.send("This channel is already set to receive thanker logs");
    }

    guild.thankerMessageChannel.push(channelID);
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            thankerMessageChannel: guild.thankerMessageChannel
        }
    }).exec();
    return message.channel.send(`${MAIN.mentionChannel(channelID)}` + " will now be used for thanks logs.");
}
exports.setThankerLogChannel = setThankerLogChannel;

const unSetThankerLogChannel = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only remove a thanker log channel from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove a thanker log channel")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (!guild.thankerMessageChannel.includes(message.channel.id)) {

        return message.channel.send("This channel is already not set to receive thanker logs");
    }

    guild.thankerMessageChannel.splice(guild.thankerMessageChannel.indexOf(message.channel.id));
    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            thankerMessageChannel: guild.thankerMessageChannel
        }
    }).exec();
    return message.channel.send("This channel will no longer be not be used for thanks logs.");
}
exports.unSetThankerLogChannel = unSetThankerLogChannel;




const setPlayingRolePair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a temp. role to be granted from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a temp. role")

    if (message.mentions.roles.size != 1)
        return message.channel.send("You have to @role exactly 1 role");

    let gameToLink = message.content.split(' ').slice(1).join(' ').split(",").splice(0)[0].trim();

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    let roleID = message.mentions.roles.first().id;
    // console.log(guild.playingRolePair);
    // console.log("------")
    // console.log(`roleID ${roleID}`)
    // console.log(`gameToLink: ${gameToLink}`)

    let found = false;

    for (let i = 0; i < guild.playingRolePair.length; i++) {

        if (guild.playingRolePair[i])
            if (guild.playingRolePair[i][0] == roleID) {
                found = true;
                let gameFound = false;
                for (let j = 1; j < guild.playingRolePair[i].length; j++) {

                    if (guild.playingRolePair[i][j] == gameToLink)
                        gameFound = true;
                }

                if (!gameFound)
                    guild.playingRolePair[i].push(gameToLink);
            }
    }

    if (!found)
        guild.playingRolePair.push([roleID, gameToLink]);

    console.log(guild.playingRolePair);


    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            playingRolePair: guild.playingRolePair
        }
    }).exec();
    return message.channel.send("The temp game-role pair has been updated!");
}
exports.setPlayingRolePair = setPlayingRolePair;


const removePlayingRolePair = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only remove a temp. role to be granted from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove a temp. role")

    if (message.mentions.roles.size != 1)
        return message.channel.send("You have to @role exactly 1 role");

    let gameToLink = message.content.split(' ').slice(1).join(' ').split(",").splice(0)[0].trim();

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });
    let roleID = message.mentions.roles.first().id;
    // console.log(guild.playingRolePair);
    // console.log("------")
    // console.log(`roleID ${roleID}`)
    // console.log(`gameToLink: ${gameToLink}`)


    for (let i = 0; i < guild.playingRolePair.length; i++) {

        if (guild.playingRolePair[i])
            if (guild.playingRolePair[i][0] == roleID) {
                for (let j = 1; j < guild.playingRolePair[i].length; j++) {

                    if (guild.playingRolePair[i][j] == gameToLink)
                        guild.playingRolePair[i].splice(j, 1);
                }

            }
    }
    console.log(guild.playingRolePair);

    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            playingRolePair: guild.playingRolePair
        }
    }).exec();
    return message.channel.send("The temp game-role pair has been updated!");
}
exports.removePlayingRolePair = removePlayingRolePair;


const setMusicRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a minimal role for music functionality from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can set a minimal role for music functionality")

    if (message.mentions.roles.size != 1)
        return message.channel.send("You have to @role exactly 1 role to add to set as the minimum");

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    let roleID = message.mentions.roles.first().id;

    guild.musicRole = roleID;

    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            musicRole: guild.musicRole
        }
    }).exec();
    return message.channel.send("The role has been set as the minimum for music commands!");
}
exports.setMusicRole = setMusicRole;

const unSetMusicRole = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only remove the minimal role for music functionality from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can remove the a minimal role for music functionality")

    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    guild.musicRole = '';

    MAIN.cachedGuilds.set(guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            musicRole: guild.musicRole
        }
    }).exec();
    return message.channel.send("The minimum role for music has been removed!");
}
exports.unSetMusicRole = unSetMusicRole


const twitchHere = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only toggle the here ping for twitch notifications from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can toggle the here ping for twitch notifications");


    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off'");
    }

    if (args == 'on') {
        message.channel.send("`@here` for twitch notifications have been enabled.");
        //  MAIN.cachedGuilds.set(message.guild.id, guild);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                twitchHERE: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        return 1;
    }

    message.channel.send("`@here` for twitch notifications have been disabled.");
    // MAIN.cachedGuilds.set(message.guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            twitchHERE: false
        }
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(message.guild.id, res);
    });
    return 1;
}
exports.twitchHere = twitchHere;

const autoRepToggle = async function (message, params, user) {


    if (message.channel.type == 'dm') return message.channel.send("You can only toggle the autoRep from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can toggle the autoRep");


    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off'");
    }

    if (args == 'on') {
        message.channel.send("AutoRep has been enabled.");

        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                autoRep: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        return 1;
    }

    message.channel.send("AutoRep has been disabled.");
    //  MAIN.cachedGuilds.set(message.guild.id, guild);
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            autoRep: false
        }
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(message.guild.id, res);
    });
    return 1;
}
exports.autoRepToggle = autoRepToggle;

const toggleProfanityFilter = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only toggle the autoRep from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can toggle the profanity filter");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.profanityFiler) {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                profanityFiler: false
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        message.channel.send('Successfully toggled off the profanity filter!');
    }
    else {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                profanityFiler: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });

        message.channel.send('Successfully toggled on the profanity filter!');
    }
}
exports.toggleProfanityFilter = toggleProfanityFilter;

const togglePrevRoleRemove = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only toggle the removal of previous roles from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can toggle the automatic role removal");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.prevRoleRemove) {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                prevRoleRemove: false
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        message.channel.send('Successfully toggled off the prev role removal!');
    }
    else {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                prevRoleRemove: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });

        message.channel.send('Successfully toggled on the prev role removal!');
    }
}
exports.togglePrevRoleRemove = togglePrevRoleRemove;



const toggleDailyThankerRep = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only toggle the daily limit for Thanker Rep from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("Only admins can toggle the daily limit for Thanker Rep");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    if (guild.dailyAutoRepLimit) {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                dailyAutoRepLimit: false
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        message.channel.send('Successfully toggled off the daily limit for Thanker Rep!');
    }
    else {
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                dailyAutoRepLimit: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });

        message.channel.send('Successfully toggled on the daily limit for Thanker Rep!');
    }
}
exports.toggleDailyThankerRep = toggleDailyThankerRep;




const youtubeHere = async function (message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off");
    }

    if (args == 'on') {
        message.channel.send("`@here` for youtube notifications have been enabled.");
        //   MAIN.cachedGuilds.set(gmessage.guild.id, guild);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                youtubeHERE: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        return 1;
    }
    // MAIN.cachedGuilds.set(message.guild.id, guild);
    message.channel.send("`@here` for youtube notifications have been disabled.");
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            youtubeHERE: false
        }
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(message.guild.id, res);
    });
    return 1;
}
exports.youtubeHere = youtubeHere;

const factionNewMemberPoints = async function (message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off");
    }

    if (args == 'on') {
        message.channel.send("Faction points for new members will be awarded!");
        //   MAIN.cachedGuilds.set(gmessage.guild.id, guild);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                factionNewMemberPoints: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        return 1;
    }
    // MAIN.cachedGuilds.set(message.guild.id, guild);
    message.channel.send("Faction points for new members will not be awarded!");
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            factionNewMemberPoints: false
        }
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(message.guild.id, res);
    });
    return 1;
}
exports.factionNewMemberPoints = factionNewMemberPoints;

const gameRolePing = async function (message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off");
    }

    if (args == 'on') {
        message.channel.send("Users will now be DM'ed when their ROLE is pinged for a game.");
        //MAIN.cachedGuilds.set(gmessage.guild.id, guild);
        Guild.findOneAndUpdate({
            id: message.guild.id
        }, {
            $set: {
                gameRolePing: true
            }
        }, function (err, doc, res) {
            MAIN.cachedGuilds.set(message.guild.id, res);
        });
        return 1;
    }
    // MAIN.cachedGuilds.set(message.guild.id, guild);
    message.channel.send("Users will not be DM'ed when their ROLE is pinged for a game.");
    Guild.findOneAndUpdate({
        id: message.guild.id
    }, {
        $set: {
            gameRolePing: false
        }
    }, function (err, doc, res) {
        MAIN.cachedGuilds.set(message.guild.id, res);
    });
    return 1;
}
exports.gameRolePing = gameRolePing;