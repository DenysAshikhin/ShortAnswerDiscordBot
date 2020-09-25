const MAIN = require('./short-answer.js');
const Guild = require('./Guild.js')

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

        switch (params.step) {

            case 1://Comes from matcher

                await message.channel.send(""`1) Please enter the title for the autorole message (Max. 250 characters):`
                    + "\nThis is what the message currently will look like:");
                await message.channel.send({ embed: { ...params.runningEmbed } });

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
                    await message.channel.send("`2) Please enter the description for the autorole message (Max. 1000 characters):`"
                        + "\nThis is what the message currently will look like:");
                    await message.channel.send({ embed: { ...params.runningEmbed } });

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

                await message.channel.send("`3) Please enter an emoji and @role to pair seperated by **,** (must be a valid universal emoji or specific to this server!):`"
                    + "```*emoji*, @role```"
                    + "\nThis is what the message currently will look like:");
                await message.channel.send({ embed: { ...params.runningEmbed } });

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

                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 6,
                        }
                    }, user);
                }
                else if(message.mentions.roles.size != 1){

                    await message.channel.send("You made an error in writing the emoji-@role. Make sure to @mention only 1 role! Refer to the example below!"
                        + "```*emoji*, @role```");

                    return MAIN.createRunningCommand(message, {
                        command: autorole, commandParams:
                        {
                            ...params,
                            step: 6,
                        }
                    }, user);
                
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


        let content = message.content;

        console.log(JSON.stringify(content));

        let found = message.guild.emojis.cache.get(message.content.substring(message.content.indexOf(':', 3) + 1, message.content.indexOf('>')));
        console.log(found);

        await message.channel.send("Welcome to the autorole message creator. This is what the message will currently look like:");

        let embed1 = { ...MAIN.Embed, footer: '', title: '', timestamp: null };
        await message.channel.send({ embed: embed1 });

        await message.channel.send("Please be careful with all your future inputs.\n`Step 1) Please enter the title for the message (Max. 250 characters):`");


        return MAIN.createRunningCommand(message, {
            command: autorole, commandParams:
            {
                step: 2,
                runningEmbed: embed1,
                guildID: message.guild.id,
                channelID: message.channel.id,
                title: '',
                description: ''
            }
        }, user);
    }
}
exports.autorole = autorole;
