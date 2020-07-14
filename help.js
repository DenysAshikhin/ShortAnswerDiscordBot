const MAIN = require('./short-answer.js');
const Commands = require('./commands.json');


function gameHelp(message, params, user) {

    generalHelpMessage(message, 1, `Games Commands`);
}
exports.gameHelp = gameHelp;

async function helpStats(message, params, user) {

    generalHelpMessage(message, 2, `Stats Commands`);
}
exports.helpStats = helpStats;

function helpMiscellaneous(message) {

    generalHelpMessage(message, 3, `Miscellaneous Commands`);
}
exports.helpMiscellaneous = helpMiscellaneous;

function helpMusic(message, params, user) {

    generalHelpMessage(message, 4, `Music Commands`);
}
exports.helpMusic = helpMusic;

function helpAdministrator(message, params, user) {

    generalHelpMessage(message, 5, `Admin Commands`);
}
exports.helpAdministrator = helpAdministrator;

function helpQOF(message, params, user) {

    generalHelpMessage(message, 6, `Quality of Life Commands`);
}
exports.helpQOF = helpQOF;

function helpGeneral(message, params, user) {

    generalHelpMessage(message, 8, `General Commands`);
}
exports.helpGeneral = helpGeneral;

function helpTutorials(message, params, user) {

    generalHelpMessage(message, 9, `Tutorial Commands`);
}
exports.helpTutorials = helpTutorials;

function helpBugsSuggestions(message, params, user) {

    generalHelpMessage(message, 10, `Bugs/Suggestion Commands`);
}
exports.helpBugsSuggestions = helpBugsSuggestions;

function helpTwitch(message, params, user) {

    generalHelpMessage(message, 11, `Twitch Commands`);
}
exports.helpTwitch = helpTwitch;






const generalHelpMessage = async function (message, tag, title) {

    let fields = [];
    for (let i = 0; i < MAIN.commandsText.normal.length; i++)
        if (MAIN.Commands[i].subsection.includes(tag))
            fields.push({ name: MAIN.Commands[i].category, value: MAIN.Commands[i].title, });


    fields.sort((a, b) => {
        if (a.name == "*Other*")
            if (b.name != "*Other*")
                return 1;
            else
                return -1;
        else
            if (b.name == "*Other*")
                return -1;
            else
                return a.name.localeCompare(b.name);
    })

    return MAIN.prettyEmbed(message, fields,
        {
            modifier: 1, title: title, startTally: 1,
            //maxLength: 1000,
            description: "```md\n" + `You can find out more information about any command by typing <${prefix}help Command>` + "```"
        });
}










function generalHelp(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");

    if (!args) {

        return MAIN.prettyEmbed(message,
            [
                { name: "Popular", value: "Games", inline: true },
                { name: "Popular", value: "Music", inline: true },
                // { name: "Guide", value: "Help", inline: true },
                { name: "Guide", value: "Tutorials", inline: true },
                { name: "Fun", value: "Stats", inline: true },
                { name: "Fun", value: "Miscellaneous", inline: true },
                { name: "Others", value: "General", inline: true },
                { name: "Others", value: "QualityOfLife", inline: true },
                { name: "Hush-Hush", value: "Admins", inline: true },
                { name: "Hush-Hush", value: "Bugs/Suggestions", inline: true },
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