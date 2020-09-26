const MAIN = require('./short-answer.js');
const Guild = require('./Guild.js')

var autoRoleMap = new Map();
var autoRoleCollectors = [];

async function initialiseUsers(message) {
    if (message.channel.type == 'dm') return -1;
    let newUsers = 0;
    let existingUsers = 0;

    for (let MEMBER of message.channel.guild.members.cache) {

        let member = MEMBER[1];

        if (await (MAIN.checkExistance(member))) {//User exists with a matching guild in the DB
            existingUsers++;
        }
        else {

            (await createUser(member));
            newUsers++;
        }
    }
    message.channel.send("The server's users are now tracked!");
}
exports.initialiseUsers = initialiseUsers;

async function setDefaultServerPrefix(message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set the default server prefix from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("You do not have the required permissions to set the default prefix for the server")


    if ((message.mentions.channels.size != 0) || (message.mentions.crosspostedChannels.size != 0)
        || (message.mentions.members.size != 0) || (message.mentions.users.size != 0)
        || (message.mentions.roles.size != 0) || (message.mentions.everyone))
        return message.channel.send("You cannot have a mention when setting a prefix!");


    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    // let index = user.guilds.indexOf(message.guild.id);
    // user.prefix[index] = params;

    if (params == -1) return message.channel.send(`You can't set your prefix to ${params}`);

    message.channel.send(`This server's default prefix is: "${params}"`);

    if (params == "sa!") params = -1;

    Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { prefix: params } }, { new: true }, function (err, doc, res) { MAIN.cachedGuilds.set(doc.id, doc) });
    return 1;
}
exports.setDefaultServerPrefix = setDefaultServerPrefix;

const autorole = async function (message, params, user) {

    if (message.content == '-1')
        return 0;

    if (params.step) {

        params.numMessages++;

        switch (params.step) {

            case 1://Comes from matcher

                await message.channel.send(`1) Please enter the title for the autorole message (Max. 250 characters):`
                    + "\nThis is what the message currently will look like:");
                await message.channel.send({ embed: { ...params.runningEmbed } });
                params.numMessages += 2;

                return MAIN.createRunningCommand(message, {
                    command: autorole, commandParams:
                    {
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
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 2,
                        }
                    }, user);
                }
                else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({ embed: { ...params.runningEmbed, title: message.content } });
                    params.numMessages += 4;//might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [
                        {
                            ...params, step: 3, title: message.content
                        },
                        {
                            ...params, step: 1
                        }
                    ], autorole, `Do you wish to keep:  **${message.content}**   as the title or change it?`);
                }
                break;
            case 3:

                if (params.title.length > 250) {

                    await message.channel.send("The title is limited to 250 characters." + `Yours was ${params.title.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 1,
                        }
                    }, user);
                }
                else if (message.content.length <= 1000) {

                    params.runningEmbed.title = params.title;
                    await message.channel.send("\nThis is what the message currently will look like:");
                    await message.channel.send({ embed: { ...params.runningEmbed } });
                    await message.channel.send("`2) Please enter the description for the autorole message (Max. 1000 characters):`");
                    params.numMessages += 3;


                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 4
                        }
                    }, user);
                }
                else {

                    await message.channel.send("The description is limited to 1000 characters." + `Yours was ${message.content.length}! Try again.`)
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
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
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 3,
                        }
                    }, user);
                }
                else {

                    await message.channel.send("This is what the message will currently look like:");
                    await message.channel.send({ embed: { ...params.runningEmbed, description: message.content } });
                    params.numMessages += 4;//might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Keep', 'Change'], [
                        {
                            ...params, step: 5, description: message.content, runningEmbed: { ...params.runningEmbed, description: message.content }
                        },
                        {
                            ...params, step: 3
                        }
                    ], autorole, `Do you wish to keep:  **${message.content}**   as the description or change it?`);
                }
            case 5:

                await message.channel.send("`3) Please enter an emoji and @role to pair seperated by **,** (must be a valid universal emoji or specific to this server!):` "
                    + "```*emoji*, @role```"
                    + "\nThis is what the message currently will look like:");
                let tempy = await message.channel.send({ embed: { ...params.runningEmbed } });
                params.numMessages += 2;

                if (params.newEmoji) {
                    params.emojis.push(params.newEmoji);
                    params.roles.push(params.newEmoji.roleID);
                    params.newEmoji = null;
                }
                reactEmoji(tempy, params.emojis);

                return MAIN.createRunningCommand(message, {
                    command: autorole, commandParams:
                    {
                        ...params,
                        step: 6,
                    }
                }, user);

                break;
            case 6:

                if (message.content.split(',').length != 2) {

                    await message.channel.send("You made an error in writing the emoji-@role. Refer to the example below!"
                        + "```*emoji*, @role```");
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 6,
                        }
                    }, user);
                }
                else if (message.mentions.roles.size != 1) {

                    await message.channel.send("You made an error in writing the emoji-@role. Make sure to @mention only 1 role! Refer to the example below!"
                        + "```*emoji*, @role```");
                    params.numMessages++;
                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 6,
                        }
                    }, user);
                }
                else {

                    let args = message.content.split(',');
                    let emoji = args[0].trim();
                    let emojiID = null;
                    let role = message.mentions.roles.first().id;

                    if ((await giveRoleSelf(message, role)) != 1) {

                        await message.channel.send("Please fix my permissions for this role or try a different one.");
                        params.numMessages++;
                        return MAIN.createRunningCommand(message, {
                            command: autorole, commandParams:
                            {
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
                            command: autorole, commandParams:
                            {
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
                            command: autorole, commandParams:
                            {
                                ...params,
                                step: 6,
                            }
                        }, user);
                    }

                    await message.channel.send("\nThis is what the message currently will look like:");
                    let tempMess = await message.channel.send({ embed: { ...params.runningEmbed } });
                    params.numMessages += 2;
                    reactEmoji(tempMess, params.emojis);

                    if (emoji.includes(':')) {

                        let id = emoji.substring(emoji.indexOf(':', 3) + 1, emoji.indexOf('>'));
                        console.log(id);

                        let guildEmoji = message.guild.emojis.cache.get(id);
                        if (!guildEmoji) {

                            await message.channel.send("You entered an invalid emoji, make sure its universal or from this server! Refer to the example below!"
                                + "```*emoji*, @role```");
                            params.numMessages++;
                            return MAIN.createRunningCommand(message, {
                                command: autorole, commandParams:
                                {
                                    ...params,
                                    step: 6,
                                }
                            }, user);
                        }

                        emojiID = id;
                        await tempMess.react(guildEmoji);
                    }
                    else
                        await tempMess.react(emoji);

                    await message.channel.send("Don't worry about the order, they will be fixed in the next step!");
                    params.numMessages += 3;//might cause issues
                    return await MAIN.generalMatcher(message, -23, user, ['Add another pair', 'Change last pair', 'finish'], [
                        {
                            ...params, step: 5, newEmoji: { emoji: emoji, roleID: role, emojiID: emojiID }
                        },
                        {
                            ...params, step: 5, newEmoji: null
                        },
                        {
                            ...params, step: 7, newEmoji: { emoji: emoji, roleID: role, emojiID: emojiID }
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
                let tempy1 = await message.channel.send({ embed: { ...params.runningEmbed } });
                reactEmoji(tempy1, params.emojis);
                params.numMessages += 4;//might cause issues

                return await MAIN.generalMatcher(message, -23, user, ['Unique', 'Permenant', 'Neither'], [
                    {
                        ...params, step: 8, unique: true, permenant: false, neither: false
                    },
                    {
                        ...params, step: 8, unique: false, permenant: true, neither: false
                    },
                    {
                        ...params, step: 8, unique: false, permenant: false, neither: true
                    }
                ], autorole, `What kind of mode should this message enforce?\n`
                + "```" + `\n1) Unique: Limit each user to 1 reaction (they can change their reaction to gain/loose the role`
                + `\n\n2) Permenant: Limit each user to a single reaction for the lifetime of this message. They cannot change their mind after reacting.`
                + `\n\n3) Unlimited: Let everyone react to as many emojis as they want!` + "```");

                break;
            case 8:

                params.numMessages += 2;//might cause issues
                return await MAIN.generalMatcher(message, -23, user, ['Static', 'Not Static'], [
                    {
                        ...params, step: 9, static: true
                    },
                    {
                        ...params, step: 9, static: false
                    }
                ], autorole, `Would you like the message to be static? A static message will remove any other emojis to prevent mass reactions clogging up the message.`);

                break;
            case 9:

                await message.channel.send(`Below you will find the final result!`);
                let finalMessage = await message.channel.send({ embed: params.runningEmbed });
                params.messageID = finalMessage.id;
                await reactEmoji(finalMessage, params.emojis);
                autoRoleMap.set(finalMessage.id, params);
                setEmojiCollecter(params, finalMessage);
                params.numMessages += 2;

                let guild = await MAIN.findGuild({ id: message.guild.id });

                guild.autorole.push(params);

                Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { autorole: guild.autorole } }, function (err, doc, res) { });

                params.numMessages += 2;

                return await MAIN.generalMatcher(message, -23, user, ['Remove Messages', 'Keep Messages'], [
                    {
                        ...params, step: 10, remove: true
                    },
                    {
                        ...params, step: 10, remove: false
                    }
                ], autorole, "Would you like me to delete the previous setup message? Depending on how many mistakes were made, some messages might be left over."
                + " However, only the setup messages will be removed.");


                break;
            case 10:

                if (params.remove) {

                    console.log(`Removing ${params.numMessages} messages!`);

                    let messages = await message.channel.messages.fetch({ limit: params.numMessages })
                    messages.delete(params.messageID);

                    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.Client.user.id));
                    if (!permission.has("MANAGE_MESSAGES")) {

                        params.numMessages += 2;

                        return await MAIN.generalMatcher(message, -23, user, ['Try Again', "Don't Try Again"], [
                            {
                                ...params, step: 10, remove: true
                            },
                            {
                                ...params, step: 10, remove: false
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

    }
    else {

        if (message.author.id != MAIN.creatorID)
            return message.channel.send("This command is current under construction. Only the creator test it!");

        if (message.channel.type == 'dm') return message.channel.send("You can only create and autoRole Message from inside a server text channel");

        if (!message.member.permissions.has("ADMINISTRATOR"))
            return message.channel.send("Only admins may create an autorole message");



        await message.channel.send("Welcome to the autorole message creator. This is what the message will currently look like:");

        let embed1 = { ...MAIN.Embed, footer: '', title: '', timestamp: null };
        await message.channel.send({ embed: embed1 });
        await message.channel.send("```\n You can enter **-1** at any point to stop the autorole creation process!```")
        await message.channel.send("Please be careful with all your future inputs.\n`Step 1) Please enter the title for the message (Max. 250 characters):`");

        return MAIN.createRunningCommand(message, {
            command: autorole, commandParams:
            {
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
                numMessages: 5
            }
        }, user);
    }
}
exports.autorole = autorole;


const reactEmoji = async function (message, emojis) {

    for (let emojiPair of emojis) {

        //  console.log(emojiPair)

        if (emojiPair.emoji.includes(':')) {

            let id = emojiPair.emoji.substring(emojiPair.emoji.indexOf(':', 3) + 1, emojiPair.emoji.indexOf('>'));
            //   console.log(id);

            let guildEmoji = message.guild.emojis.cache.get(id);
            await message.react(guildEmoji)
                .catch(err => { });
        }
        else
            await message.react(emojiPair.emoji)
                .catch(err => { });
    }
}

const giveRoleSelf = async function (message, roleID) {

    let roleToAdd;
    let guildMember = message.guild.members.cache.get(MAIN.Client.user.id);
    try {
        roleToAdd = message.guild.roles.cache.get(roleID);
    }
    catch (err) {

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
    }
    else
        return -1;
}

const populateAutoRoleMap = function (autoRoleObj) {

    for (let pair of autoRoleObj)
        autoRoleMap.set(pair.messageID, pair);

}

const setEmojiCollecter = async function (autoroleObj, message) {

    let collector = await message.createReactionCollector(function (reaction, user) {
        return (!user.bot)
    }, { time: 60 * 60 * 1000, dispose: true });
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
            }
            else if (!userReacted && autorole.permenant) {

                let guild = await MAIN.findGuild({ id: emoji.message.guild.id });

                let index = guild.autorole.findIndex(element => element.messageID == emoji.message.id)

                guild.autorole[index].users.push(user.id);

                let roleToAdd;

                try {
                    roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
                }
                catch (err) {

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

                return Guild.findOneAndUpdate({ id: guild.id }, { $set: { autorole: guild.autorole } }, function (err, doc, res) { })

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
                    return MAIN.selfDestructMessage(emoji.message, 'You have already reacted to this message, unreact with your previous one'
                        + ` (by clicking on it again) and then try again.`, 3, true);
                }

                for (let roly of autorole.roles) {

                    if (guildMember.roles.cache.get(roly)) {

                        emoji.users.remove(user);
                        return MAIN.selfDestructMessage(emoji.message, 'You already have one of the roles from the other reactions. You can'
                            + "'t get another until you remove the existing one.", 3, true);
                    }
                }
            }

            let roleToAdd;

            try {
                roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
            }
            catch (err) {

                return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");
            }

            if (roleToAdd)
                await guildMember.roles.add(roleToAdd)
                    .catch(function (err) {

                        emoji.message.channel.send("I didn't have the required permission to give such a role!");
                    });
            else
                return emoji.message.send("A role that was used in the autorole message no longer exists, failed to assign the role.");

        }
        else if (autorole.static) {

            return emoji.users.remove(user);

        }
        else {
        }
    });

    collector.on('remove', async function (emoji, user) {

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

        let roleToAdd;

        try {
            roleToAdd = emoji.message.guild.roles.cache.get(matchedPair.roleID);
        }
        catch (err) {

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
}

const setEmojiCollectorAll = async function (autoroleObj) {


    for (let AUTOROLE of autoroleObj) {

        let message;

        try {
            message = await (await MAIN.Client.guilds.fetch(AUTOROLE.guildID)).channels.cache.get(AUTOROLE.channelID).messages.fetch(AUTOROLE.messageID);
        }
        catch (err) {

            let channel = await (await MAIN.Client.guilds.fetch(AUTOROLE.guildID)).channels.cache.get(AUTOROLE.channelID);
            if (channel)
                channel.send("An autorole message that was here previously has been deleted. Removing it from the database and any restrictions associated with it!");


            let guild = await MAIN.findGuild({ id: AUTOROLE.guildID });

            let index = guild.autorole.findIndex(element => element.messageID == AUTOROLE.messageID)
            guild.autorole.splice(index);
            Guild.findOneAndUpdate({ id: guild.id }, { $set: { autorole: guild.autorole } }, function (err, doc, res) { })
            continue;

        }
        setEmojiCollecter(AUTOROLE, message);

    }
}

const initialiseAdministrator = async function () {

    let guilds = await MAIN.getGuilds();

    for (let GUILD of guilds) {
        let guild = GUILD;
        populateAutoRoleMap(guild.autorole);
        setEmojiCollectorAll(guild.autorole);
    }
    setInterval(resetCollectors, 30 * 60 * 1000);
}
exports.initialiseAdministrator = initialiseAdministrator;

const resetCollectors = async function () {

    for (let collector of autoRoleCollectors) {
        collector.resetTimer();
    }
}

const welcomeMessages = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only configure welcome messages from inside a server text channel");

    if (!message.member.permissions.has("ADMINISTRATOR"))
        return message.channel.send("You do not have the required permissions to configure welcome messages for the server");

    const args = message.content.split(" ").slice(1).join(" ").toLowerCase();

    if ((args != 'off') && (args != 'on')) {

        return message.channel.send("You have to specify either 'on' or 'off");
    }

    if (args == 'on') {
        message.channel.send("Welcome message have been enabled.");
        return Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { welcomeMessages: true } }, function (err, doc, res) { });
    }

    message.channel.send("Welcome message have been disabled.");
    return Guild.findOneAndUpdate({ id: message.guild.id }, { $set: { welcomeMessages: false } }, function (err, doc, res) { });
}
exports.welcomeMessages = welcomeMessages;