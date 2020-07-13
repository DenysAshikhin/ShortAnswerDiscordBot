const MAIN = require('./short-answer.js');
const Commands = require('./commands.json');

const generalHelpMessage = async function (message, tag, title) {


    let fields = [];
    for (let i = 0; i < MAIN.commandsText.normal.length; i++)
        if (MAIN.Commands[i].subsection.includes(tag))
            fields.push({ name: "** **", value: MAIN.Commands[i].title });
    // fields.push({ name: prefix + MAIN.Commands[i].title, value: MAIN.Commands[i].explanation })

    // console.log(newEmbed.fields)
    //message.channel.send({ embed: newEmbed });
    return MAIN.prettyEmbed(message, fields,
        {
            modifier: 1, title: title, startTally: 1,
            //maxLength: 1000,
            description: "```md\n" + `You can find out more information about any command by typing <${prefix}help Command>` + "```"
        });
}

async function helpStats(message, params, user) {

    generalHelpMessage(message, 2, `Stats Commands`);
}
exports.helpStats = helpStats;

function helpMusic(message, params, user) {

    generalHelpMessage(message, 4, `Music Commands`);
}
exports.helpMusic = helpMusic;

function gameHelp(message, params, user) {

    generalHelpMessage(message, 1, `Help Commands`);
}
exports.gameHelp = gameHelp;

function helpMiscellaneous(message) {

    generalHelpMessage(message, 3, `Miscellaneous Commands`);
}
exports.helpMiscellaneous = helpMiscellaneous;


function generalHelp(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");

    if (!args) {

        return MAIN.prettyEmbed(message,
            [
                { name: "** **", value: "Games", inline: true },
                { name: "** **", value: "Stats", inline: true },
                { name: "** **", value: "Miscellaneous", inline: true },
                { name: "** **", value: "Music", inline: true },
                { name: "** **", value: "Admins", inline: true },
                { name: "** **", value: "Quality of Life", inline: true },
                { name: "** **", value: "Help", inline: true },
                { name: "** **", value: "General", inline: true },
                { name: "** **", value: "Tutorials", inline: true },
                { name: "** **", value: "Bugs/Suggestions", inline: true },
            ], {
            description: "```md\n" + `You can see a list of commands under each category by typing <${prefix}helpCommand> I.E.:\n` +
                `1) <${prefix}helpMusic>` + "```", startTally: 1, modifier: 1, title: `General Help`
        });
    }

    if (params.index != null) {
        return MAIN.sendHelpMessage(params.index, message);
    }
    else {

        let promptArray = [];
        let internalArray = [];

        let command = args;
        if (user.commands) {
            for (combo of user.commands) {
                if (combo[1] == args)
                    command = combo[0];
            }
        }

        for (let i = 0; i < MAIN.Commands.length; i++) {

            promptArray.push(MAIN.Commands[i].title);
            internalArray.push({ index: i });
        }
        return MAIN.generalMatcher(message, command, user, promptArray, internalArray, generalHelp, `Enter the number of the command you wish to learn more about!`);
    }
}
exports.generalHelp = generalHelp;