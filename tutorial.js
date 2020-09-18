const MAIN = require('./short-answer.js');
const User = require('./User.js');
// const Commands = require('./commands.json');
// const GAMES = require('./games.js');


const initialTutorialPopulate = function () {

    populateSpecificCommands(IntroTutorial);
    populateSpecificCommands(GameTutorial);
}
exports.initialTutorialPopulate = initialTutorialPopulate;

const populateSpecificCommands = function (tut) {
    for (let i = 0; i < tut.expectedCommand.length; i++) {
        tut.specificCommand.push(MAIN.commandMap.get(tut.expectedCommand[i].toUpperCase()));
    }
}


const tutorialMap = new Map();

const IntroTutorial = {
    expectedCommand: [
        MAIN.Commands[8].title,//helpGames
        MAIN.Commands[1].title//search
    ],
    specificCommand: [
    ],
    expectedOutput: [
        0,
        2
    ],
    steps: [
        `Welcome to the general introduction. If nothing else, please remember that this bot breaks up commands into 3 parts`
        + "```\n 1)The prefix\n2) The command itself\n3) Any (sometimes optional) parameters.```" + `By default, the prefix will be **sa!**`
        + `\nThe command can be anything, for this example we will use helpGames. There are no parameters here, but they will be covered later.`
        + ` Please proceed by calling the command below.`,

        `Now I will introduce a command which can take an unlimited number of parameters. Parameters are seperated from the prefix+command by a space.`
        + ` In the case of needing/wanting to use multiple parameters, seperate each one by comma. ` + "`" + "To continue please use the command below with 2 or more" 
        + ` parameters!` + "`",

        "Congratulations on finishing the introductory tutorial!"
    ],
    id: 100
};
tutorialMap.set(IntroTutorial.id, IntroTutorial);

const GameTutorial = {
    expectedCommand: [
        MAIN.Commands[1].title,//"SEARCH"
        MAIN.Commands[2].title,//"SIGNUP"
        MAIN.Commands[2].title,//"SIGNUP"
        MAIN.Commands[3].title,//"MYGAMES"
        MAIN.Commands[4].title,//"REMOVEGAME"
        MAIN.Commands[13].title,//"PING",
        MAIN.Commands[50].title,//"BANISH",
        MAIN.Commands[47].title,// Queue
        MAIN.Commands[48].title,// deQueue
        MAIN.Commands[5].title,//"EXCLUDEPING"
        MAIN.Commands[6].title//"EXCLUDEDM"
    ],
    specificCommand: [
        // GAMES.search,
        // GAMES.updateGames,
        // GAMES.updateGames,
        // GAMES.personalGames,
        // GAMES.removeGame,
        // GAMES.pingUsers,
        // GAMES.banish,
        // GAMES.Queue,
        // GAMES.deQueue,
        // GAMES.excludePing,
        // GAMES.excludeDM
    ],
    expectedOutput: [
        1,
        1,
        2,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0
    ],
    steps: [
        `Awesome, welcome to the game tutorial! let's start by searching for a game you play with others!`,

        `Now that you see a bunch of results, hopefully the game you wanted is towards the top, along with the associated number.`
        + ` Please add any valid (and new) game to your games list to continue`,

        `You can also sign up for as many games at once as you would like by seperating each entry by a comma - you can mix both words and numbers.`
        + ` Try signing up for **at least two new games** at once.`,

        `Now that we have some games tracked for you, let's view your complete game list!`,

        `Now try removing any of the games in your games list using the command below!`,

        `Onto the fun stuff, if you want to play a game but not sure who is up for it, you can ping and anyone who has this game will be notified.`,

        `If someone joined your summon that you don't like, you can banish them from it.`,

        `You can also join someone else's summon.`,

        `Alternatively, if you want to leave a summon or disband your own summon.`,

        `Almost done, now some quality of life, when someone pings a game there will be two notifications for you, the first is`
        + ` an @mention in the text channel it was sent from. To disable/enable @mentions use the command below - *False* = you will be pinged, *True* = you will not be pinged.`,

        `The second notification is a direct message. To disable/enable direct messages from pings - *False* = you will be DMed, *True* = you will not be DMed.`,

        `Congratulations! You have completed the game tutorial. As a reward, you can now offer feedback, suggestions or anything else to the creator by using`
        + ` the **suggest** command and I'll forward the message to the creator.`
        + `\nAs a final note, this bot is being rapidly developed with new features constantly being added,`
        + ` if you would like to recieve a private message when a new feature is live, use the **updateMe** command.`
    ],
    id: 1
};
tutorialMap.set(GameTutorial.id, GameTutorial);

//exports.tutorialMap = tutorialMap;



/**
 * @param {forceStart: Number} other 
 */
const tutorialStarter = async function (message, params, command, user, other) {

    other = other ? other : {};
    if ((user.activeTutorial == -1) && (!other.forceStart)) return -22;

    let tutorialDecider = other.forceStart ? other.forceStart : user.activeTutorial;

    //Determining if the command that was being asked of the bot is the one the user is currently on in the tutorial
    let specificCommand = tutorialMap.get(user.activeTutorial) ? command == tutorialMap.get(user.activeTutorial).specificCommand[user.tutorialStep] : false;

    switch (tutorialDecider) {
        case 1:
            if (specificCommand || (command == gameTutorial)) {
                return await generalTutorial(message, params, command, GameTutorial, gameTutorial, user);
            }
            break;
        case 2:

            break;


        case 100:
            if (specificCommand || (command == introTutorial)) {
                return await generalTutorial(message, params, command, IntroTutorial, introTutorial, user);
            }
            break;
    }

    return -22;//No tutorial was triggered
}
exports.tutorialStarter = tutorialStarter;


const generalTutorial = async function (message, params, command, tutorial, tutorialCommand, user) {

    user = await MAIN.findUser({ id: user.id });

    if (user.tutorialStep == -1) {

        message.channel.send(tutorial.steps[0]);
        MAIN.sendHelpMessage(MAIN.commandsText.normal.indexOf(tutorial.expectedCommand[0]), message);

        await User.findOneAndUpdate({ id: user.id },
            {
                $set: {
                    activeTutorial: tutorial.id,
                    tutorialStep: 0,
                    previousTutorialStep: 0
                }
            }, function (err, doc, res) { });
        return 1;
    }
    else {
        if ((user.activeTutorial == tutorial.id) || (user.activeTutorial == -1)) {

            if (command == tutorialCommand) {

                message.channel.send(tutorial.steps[user.tutorialStep]);
                let Index = MAIN.commandsText.normal.indexOf(tutorial.expectedCommand[user.tutorialStep]);

                console.log(tutorial.expectedCommand[user.tutorialStep])
                MAIN.sendHelpMessage(Index, message);
                return 1;
            }
            else if ((user.tutorialStep - user.previousTutorialStep) == 1) {//If the user completed a previous step succesfuly, give the new prompt

                if (user.tutorialStep != (tutorial.steps.length - 1)) {

                    message.channel.send(tutorial.steps[user.tutorialStep]);
                    MAIN.sendHelpMessage(MAIN.commandsText.normal.indexOf(tutorial.expectedCommand[user.tutorialStep]), message);
                    await User.findOneAndUpdate({ id: user.id },
                        {
                            $set: {
                                previousTutorialStep: user.previousTutorialStep + 1,
                            }
                        }, function (err, doc, res) { });
                    return 1;
                }
                else {//Tutorial over!!!!!
                    //Need to add the recommend and something else commands
                    message.channel.send(tutorial.steps[user.tutorialStep]);

                    // MAIN.sendHelpMessage(MAIN.commandsText.upperCase.indexOf('UPDATEME'), message);
                    // MAIN.sendHelpMessage(MAIN.commandsText.upperCase.indexOf('SUGGEST'), message);
                    if (!user.completedTutorials.includes(tutorial.id)) {
                        user.completedTutorials.push(tutorial.id);
                    }
                    await User.findOneAndUpdate({ id: user.id },
                        {
                            $set: {
                                activeTutorial: -1,
                                previousTutorialStep: -1,
                                tutorialStep: -1,
                                canSuggest: true,
                                completedTutorials: user.completedTutorials

                            }
                        }, function (err, doc, res) { });
                    return 1;
                }
            }
            else {//Test if their response is the correct one.

                if (command == tutorial.specificCommand[user.tutorialStep]) {
                    let result = await tutorial.specificCommand[user.tutorialStep].call(null, message, params, user);
                    if (result >= tutorial.expectedOutput[user.tutorialStep]) {
                        User.findOneAndUpdate({ id: user.id }, { $set: { tutorialStep: user.tutorialStep + 1 } }, function (err, doc, res) {
                            setTimeout(generalTutorial, 1000, message, params, command, tutorial, tutorialCommand, user);
                        });

                    }
                    return result;
                }
                else
                    return false;
            }
        }
        else {
            message.channel.send(`You are already doing a different tutorial, to quit it type **${prefix}quitTutorial**`);
            return 1;
        }
    }
}


async function gameTutorial(message, params, user) {

    return await tutorialStarter(message, params, gameTutorial, user, { forceStart: 1 });
}
exports.gameTutorial = gameTutorial;

async function introTutorial(message, params, user) {

    return await tutorialStarter(message, params, introTutorial, user, { forceStart: 100 });
}
exports.introTutorial = introTutorial;

function quitTutorial(message, params, user) {

    User.findOneAndUpdate({ id: user.id },
        {
            $set: {

                activeTutorial: -1,
                tutorialStep: -1,
                previousTutorialStep: -1
            }
        }, function (err, doc, res) {
            if (err) console.trace(err)
            if (res) console.trace(res)
        });
    message.channel.send("You have quit the previous tutorial and may begin a new one at any point!");
}
exports.quitTutorial = quitTutorial;

function setNotifyTutorials(message, params, user) {

    if (!message.content.split(" ")[1]) {
        message.channel.send("You must enter either true or false: **" + prefix + "tutorials** *true/false*");
        return -1;
    }
    let bool = message.content.split(" ")[1].toUpperCase().trim();
    if (bool == "TRUE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyTutorial: true } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " will be notified of new/incomplete tutorials.");
        return 1;
    }
    else if (bool == "FALSE") {

        User.findOneAndUpdate({ id: message.author.id }, { $set: { notifyTutorial: false } }, function (err, doc, res) { });
        message.channel.send(MAIN.mention(message.author.id) + " will be excluded from any new/incomplete tutorials.");
        return 0;
    }
    else {
        message.channel.send("You must enter either true or false: **" + prefix + "tutorials** *true/false*");
        return -1;
    }
}
exports.setNotifyTutorials = setNotifyTutorials;

function createTutorialEmbed(tutorialStep) {

    let prompt = GameTutorial.steps[tutorialStep];
    let index = MAIN.Commands.commands.indexOf(GameTutorial.expectedCommand[tutorialStep]);
    let fieldArray = new Array();

    if (index != -1) {
        for (let i = 0; i < MAIN.Commands.example[index].length; i++) {

            fieldArray.push({
                name: `Example ${i + 1})`,
                value: prefix + MAIN.Commands.example[index][i].substring(3)
            })
        }
    } else {

    }

    let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    newEmbed.date = new Date();
    newEmbed.title += " Game Tutorial";
    newEmbed.description = prompt;
    newEmbed.fields = fieldArray;

    return newEmbed;
}

// //-22 meaning no matching tutorial was found
// async function tutorialHandler(message, command, params, user) {

//     switch (user.activeTutorial) {
//         case 0:
//             if (command == GameTutorial.specificCommand[user.tutorialStep] || command == gameTutorial) {

//                 return await gameTutorial(message, params, MAIN.commandMap.get('gameTutorial'), );
//             }
//         case 1:

//             break;
//     }

//     return -22;
// }
// exports.tutorialHandler = tutorialHandler;