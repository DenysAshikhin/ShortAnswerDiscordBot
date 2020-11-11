const MAIN = require('./short-answer.js');
const Commands = require('./commands.json');


function gameHelp(message, params, user) {

    return generalHelpMessage(message, 'games', `Games Commands`, user);
}
exports.gameHelp = gameHelp;

async function helpStats(message, params, user) {

    return generalHelpMessage(message, 'stats', `Stats Commands`, user);
}
exports.helpStats = helpStats;

function helpMiscellaneous(message, params, user) {

    return generalHelpMessage(message, 'miscellaneous', `Miscellaneous Commands`, user);
}
exports.helpMiscellaneous = helpMiscellaneous;

function helpMusic(message, params, user) {

    return generalHelpMessage(message, 'music', `Music Commands`, user);
}
exports.helpMusic = helpMusic;

function helpAdministrator(message, params, user) {

    return generalHelpMessage(message, 'admin', `Admin Commands`, user);
}
exports.helpAdministrator = helpAdministrator;

function helpQOF(message, params, user) {

    return generalHelpMessage(message, 'qof', `Quality of Life Commands`, user);
}
exports.helpQOF = helpQOF;

function helpGeneral(message, params, user) {

    return generalHelpMessage(message, 'general', `General Commands`, user);
}
exports.helpGeneral = helpGeneral;

function helpTutorials(message, params, user) {

    return generalHelpMessage(message, 'tutorial', `Tutorial Commands`, user);
}
exports.helpTutorials = helpTutorials;

function helpBugsSuggestions(message, params, user) {

    return generalHelpMessage(message, 'bugs', `Bugs/Suggestion Commands`, user);
}
exports.helpBugsSuggestions = helpBugsSuggestions;

function helpTwitch(message, params, user) {

    return generalHelpMessage(message, 'notifications', `Notification Commands`, user);
}
exports.helpTwitch = helpTwitch;

const helpFirstTime = async function (message, params, user) {

    return generalHelpMessage(message, 'firstTime', `First Time Commands`, user);
}
exports.helpFirstTime = helpFirstTime;




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

    let description = ``;

    switch (tag) {
        case 1:
            description += `Here you can find all the commands pertaining to organizing or summoning people to play games. Or contribute to current faction battles!`;
    }

    description += "```md\n" + `You can find out more information about any command by typing <${(await MAIN.getPrefix(message, user))}help Command>` + "```";


    if (!user.completedTutorials.includes(tag))
        switch (tag) {
            case 'games':
                description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}gameTutorial` + "```";
                break;
            case 2:
                //   description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}statsTutorial` + "```";
                break;
            case 3:
                //   description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}miscellaneousTutorial` + "```";
                break;
            case 4:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}musicTutorial` + "```";
                break;
            case 5:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}administratorTutorial` + "```";
                break;
            case 6:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}qofTutorial` + "```";
                break;
            case 7:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}helpTutorial` + "```";
                break;
            case 8:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}generalTutorial` + "```";
                break;
            case 9:
                //  description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}tutorialsTutorial` + "```";
                break;
            case 10:
                //    description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await MAIN.getPrefix(message, user))}gameTutorial` + "```";
                break;
            case 11:
                // description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await (await MAIN.getPrefix(message, user)))}twitchTutorial` + "```";
                break;
            case 12:
                // description += "```fix\nYou have not completed the tutorial for this section, you can do so by typing " + `${(await (await MAIN.getPrefix(message, user)))}twitchTutorial` + "```";
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


async function generalHelp(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");

    if (!args) {

        let description = "```md\n" + `You can see a list of commands under each category by typing <${(await MAIN.getPrefix(message, user))}helpCommand> I.E.:\n` +
            `1) <${(await MAIN.getPrefix(message, user))}helpMusic>` + "```";


       // if (!user.completedTutorials.includes(100))
           // description += "```fix\n" + `You have not completed the introductory tutorial which would teach you the basics of using the bot,`
               // + ` you can do so by typing ${(await MAIN.getPrefix(message, user))}introTutorial` + "```";

        return MAIN.prettyEmbed(message,
            [
                { name: "Popular", value: "Games", inline: true },
                { name: "Popular", value: "Music", inline: true },
                { name: "Popular", value: "Notifications", inline: true },
                // { name: "Guide", value: "Help", inline: true },
                { name: "Useful", value: "firstTime", inline: true },
                { name: "Useful", value: "Tutorials", inline: true },
                { name: "Fun", value: "Stats", inline: true },
                { name: "Fun", value: "Miscellaneous", inline: true },
                { name: "Others", value: "General", inline: true },
                { name: "Others", value: "QualityOfLife", inline: true },
                { name: "Hush-Hush", value: "Admins", inline: true },
                { name: "Hush-Hush", value: "Bugs/Suggestions", inline: true },
                { name: "🔥**Invite Commands**🔥", value: "inviteMe" },
                { name: "🔥**Invite Commands**🔥", value: "inviteSupportServer" }
            ], {
            description: description, startTally: 1, modifier: 1, title: `General Help`
        });
    }

    if (params.index != null) {
        return MAIN.sendHelpMessage(params.index, message, user);
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