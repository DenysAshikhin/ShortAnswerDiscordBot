const MAIN = require('./short-answer.js');
//const Commands = require('./commands.json');
const User = require('./User.js');

var timers = new Map();


async function commandMonikers(message, params, user) {

    if (!user.commands.length) return message.channel.send("You have no command monikers!");

    let fieldArray = [];

    for (combo of user.commands) {

        fieldArray.push({ name: '', value: `<${combo[0]} ${combo[1]}>\n` })
    }

    MAIN.prettyEmbed(message, fieldArray, {
        description: "```md\n" + 'The monikers will take the format of:\n<originalCommand commandMoniker>' + "```",
        startTally: 1, modifier: 'md'
    });
    //MAIN.prettyEmbed(message, "```md\n" + 'The monikers will take the format of:\n<originalCommand commandMoniker>' + "```", fieldArray, -1, 1, 'md');
}
exports.commandMonikers = commandMonikers;

async function removeMoniker(message, params, user) {

    if (!user.commands.length) return message.channel.send("You have no command monikers!");

    const args = params.loop ? params.moniker : message.content.split(" ").slice(1).join(" ").toUpperCase();

    for (combo of user.commands) {

        if (combo[1] == args) {
            message.channel.send(`Removing the moniker ${args} for the command ${combo[0]}!`);
            user.commands.splice(user.commands.indexOf(combo), 1);
            return User.findOneAndUpdate({ id: message.author.id }, { $set: { commands: user.commands } }, function (err, doc, res) { });
        }
    }

    return MAIN.generalMatcher(message, args, user, user.commands.reduce((accum, current) => { accum.push(current[1]); return accum; }, []),
        user.commands.reduce((accum, current) => {
            accum.push({ loop: true, moniker: current[1] });
            return accum;
        }, []),
        removeMoniker, "Choose which moniker you meant to remove:");

}
exports.removeMoniker = removeMoniker;

async function setCommand(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ").split(',');

    if (!params.loop) {

        if (!args[0].trim()) return message.channel.send("You first have to provide the original command you wish to create a monkier for!");
        args[0] = args[0].trim().toUpperCase();
        if (!args[1]) return message.channel.send("You have to provide the moniker for the original command, **seperated by a comma**.");
        if (!args[1].trim() || (args[1].trim().length < 1)) return message.channel.send("You have to provide the moniker for the original command, **seperated by a comma**.");
        args[1] = args[1].trim().toUpperCase();

        if (!MAIN.commandsText.upperCase.includes(args[0])) {

            let internalArray = [];

            for (comm of MAIN.commandsText.upperCase) {
                internalArray.push({ loop: true, args: [comm, args[1]] });
            }

            return MAIN.generalMatcher(message, args[0], user, MAIN.commandsText.normal, internalArray,
                setCommand, "Select which command you meant to create a moniker for: ");
        }
    }

    args = params.loop ? params.args : args;

    for (combo of user.commands) {
        if ((combo[1] == args[1]) && (combo[0] != args[0]))
            return message.channel.send(`Aborting the process as the command ${combo[0]} already has the moniker of ${args[1]}!`);
    }
    //Broke into two loops, to check the whole thing for duplicate monikers first!
    for (combo of user.commands) {
        if (combo[0] == args[0]) {
            message.channel.send(`Overwriting your old moniker (${combo[1]}) for ${args[0]} with ${args[1]}`);
            combo[1] = args[1];
            return User.findOneAndUpdate({ id: message.author.id }, { $set: { commands: user.commands } }, function (err, doc, res) { });
        }
    }

    user.commands.push([args[0], args[1]]);
    User.findOneAndUpdate({ id: message.author.id }, { $set: { commands: user.commands } }, function (err, doc, res) { });
    return message.channel.send(`The command ${args[0]} now has the moniker of ${args[1]}`);
}
exports.setCommand = setCommand;

function setNotifyUpdate(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + "updateMe** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyUpdate: true } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " will be notified of new feature releases.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyUpdate: false } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " will be excluded from any new feature releases.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + + "updateMe** *true/false*");
        return -1;
    }
}
exports.setNotifyUpdate = setNotifyUpdate;

async function setTimer(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to provide a time for the timer!");

    if (!/^[:0-9]+$/.test(args)) return message.channel.send("You have entered an invalid time format!");

    if (args.includes(':'))
        args = MAIN.hmsToSecondsOnly(args);

    let author = message.author;

    if (timers.get(user.id))
        message = await message.channel.send(`Overwriting your previous timer (${MAIN.timeConvert(timers.get(user.id).time)} remaining) to: ${MAIN.timeConvert(args)}`);
    else
        message = await message.channel.send(`Set a timer to go off in ${MAIN.timeConvert(args)}`)

    return timers.set(user.id, { time: args, author: author, message: message });
}
exports.setTimer = setTimer;

async function setServerPrefix(message, params, user) {

    if (params == message.content) {
        message.channel.send("You have to provide an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    let index = user.guilds.indexOf(message.guild.id);
    user.prefix[index] = params;

    if (params == -1) return message.channel.send(`You can't set your prefix to ${params}`);

    message.channel.send(`Your new prefix for this server is: "${params}"`);

    if (params == "sa!") params = -1;

    await User.findOneAndUpdate({ id: user.id }, { $set: { prefix: user.prefix } }, { new: true }, function (err, doc, res) { MAIN.cachedUsers.set(doc.id, doc) });
    return 1;
}
exports.setServerPrefix = setServerPrefix;

async function setDefaultPrefix(message, params, user) {

    if (params == message.content) {
        message.channel.send("You have to provde an actual prefix!");
        return -1;
    }
    if (Array.isArray(params))
        params = params[0];

    if (params == -1) return message.channel.send(`You can't set your prefix to ${params}`);

    message.channel.send(`Your new base (default) prefix is: "${params}"`);

    if (params == "sa!") params = -1;

    User.findOneAndUpdate({ id: user.id }, { $set: { defaultPrefix: params } }, { new: true }, function (err, doc, res) { MAIN.cachedUsers.set(doc.id, doc) });
    return 1;
}
exports.setDefaultPrefix = setDefaultPrefix;

async function timerTrack() {
    for (timer of timers.entries()) {

        timer[1].time -= 2;
        timer[1].message.edit(`Set a timer to go off in ${MAIN.timeConvert(timer[1].time)}`);
        if (timer[1].time <= 0) {
            timer[1].author.send("Your timer has finished!");
            timers.delete(timer[0]);
            timer[1].message.edit(":alarm_clock: *Ring* **Ring** *Ring* :alarm_clock:");
        }
    }
}
setInterval(timerTrack, 2000);