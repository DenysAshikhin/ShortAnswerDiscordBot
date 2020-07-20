const MAIN = require('./short-answer.js');
const Commands = require('./commands.json');


function gameHelp(message, params, user) {

    return generalHelpMessage(message, 1, `Games Commands`, user);
}
exports.gameHelp = gameHelp;

async function helpStats(message, params, user) {

    return generalHelpMessage(message, 2, `Stats Commands`, user);
}
exports.helpStats = helpStats;

function helpMiscellaneous(message) {

    return generalHelpMessage(message, 3, `Miscellaneous Commands`, user);
}
exports.helpMiscellaneous = helpMiscellaneous;

function helpMusic(message, params, user) {

    return generalHelpMessage(message, 4, `Music Commands`, user);
}
exports.helpMusic = helpMusic;

function helpAdministrator(message, params, user) {

    return generalHelpMessage(message, 5, `Admin Commands`, user);
}
exports.helpAdministrator = helpAdministrator;

function helpQOF(message, params, user) {

    return generalHelpMessage(message, 6, `Quality of Life Commands`, user);
}
exports.helpQOF = helpQOF;

function helpGeneral(message, params, user) {

    return generalHelpMessage(message, 8, `General Commands`, user);
}
exports.helpGeneral = helpGeneral;

function helpTutorials(message, params, user) {

    return generalHelpMessage(message, 9, `Tutorial Commands`, user);
}
exports.helpTutorials = helpTutorials;

function helpBugsSuggestions(message, params, user) {

    return generalHelpMessage(message, 10, `Bugs/Suggestion Commands`, user);
}
exports.helpBugsSuggestions = helpBugsSuggestions;

function helpTwitch(message, params, user) {

    return generalHelpMessage(message, 11, `Twitch Commands`, user);
}
exports.helpTwitch = helpTwitch;






const generalHelpMessage = async function (message, tag, title, user) {

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

    let description = "```md\n" + `You can find out more information about any command by typing <${prefix}help Command>` + "```";

    if (!user.completedTutorials.includes(tag))
        switch (tag) {
            case 1:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 2:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 3:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 4:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 5:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 6:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 7:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 8:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 9:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 10:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
            case 11:
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${prefix}gameTutorial` + "```";
                break;
        }

    MAIN.prettyEmbed(message, fields,
        {
            modifier: 1, title: title, startTally: 1,
            //maxLength: 1000,
            description: description
        });
    return 1;
}










function generalHelp(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");

    if (!args) {

        let description = "```md\n" + `You can see a list of commands under each category by typing <${prefix}helpCommand> I.E.:\n` +
            `1) <${prefix}helpMusic>` + "```";

        if (!user.completedTutorials.includes(100))
            description += "```fix\n" + `You have not completed the introductory tutorial which would teach you the basics of using the bot,`
                + ` you can do so by typing ${prefix}introTutorial` + "```";

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
            description: description, startTally: 1, modifier: 1, title: `General Help`
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