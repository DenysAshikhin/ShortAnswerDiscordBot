const MAIN = require('./short-answer.js');
const User = require('./User.js');
const Commands = require('./commands.json');
const GAMES = require('./games.js');

const GameTutorial = {
    expectedCommand: [
        Commands.commands[1],//"SEARCH"
        Commands.commands[2],//"SIGNUP"
        Commands.commands[2],//"SIGNUP"
        Commands.commands[3],//"MYGAMES"
        Commands.commands[4],//"REMOVEGAME"
        Commands.commands[13],//"PING"
        Commands.commands[5],//"EXCLUDEPING"
        Commands.commands[6]//"EXCLUDEDM"
    ],
    specificCommand: [
        GAMES.search,
        GAMES.updateGames,
        GAMES.updateGames,
        GAMES.personalGames,
        GAMES.removeGame,
        GAMES.pingUsers,
        GAMES.excludePing,
        GAMES.excludeDM
    ],
    expectedOutput: [
        1,
        1,
        2,
        0,
        1,
        0,
        0,
        0
    ],
    steps: []
};
exports.GameTutorial = GameTutorial;

async function gameTutorial(message, params, command) {

    let user = await MAIN.findUser({ id: message.author.id });

    GameTutorial.steps = [
        `Awesome, welcome to the game tutorial! let's start by searching for a game you play with others!\nDo so by typing **${prefix}search**  *nameOfGame*.`,

        `Now that you see a bunch of results, hopefully the game you wanted is towards the top, along with the associated number.`
        + ` Please add any valid (and new) game to your games list to continue`,

        `You can also sign up for as many games at once as you would like by seperating each entry by a comma - you can mix both words and numbers.`
        + ` Try signing up for **at least two new games** at once.`,

        `Now that we have some games tracked for you, let's view your complete game list by typing **${prefix}` + Commands.commands[3] + `**`,

        `Now try removing any of the games in your games list by typing **${prefix}` + Commands.commands[4] + `** *game#*.`
        + ` Just a heads up that the GAME# is the number from your games list.`,

        `Now if you want to play a game, but not sure who is up for it, you can simple type **${prefix}` + Commands.commands[13]
        + `** *nameOfGame*/*#ofGame* and anyone who has this game will be notified.`,

        `Almost done, now some quality of life, when someone pings a game there will be two notifications for you, the first is`
        + ` an @mention in the text channel it was sent from. To disable/enable @mentions simply type`
        + ` **${prefix}` + Commands.commands[5] + `** *true/false*. *False* = you will be pinged, *True* = you will not be pinged.`,

        `The second notification is a direct message. To disable/enable direct messages from pings simply type`
        + ` **${prefix}` + Commands.commands[6] + `** *true/false*. *False* = you will be DMed, *True* = you will not be DMed.`,

        `Congratulations! You have completed the game tutorial. As a reward, you can now offer feedback, suggestions or anything else to the creator by typing`
        + ` **${prefix}` + Commands.commands[26] + `** *any suggestion here* and I'll forward the message to the creator. For a more general help,`
        + ` type **${prefix}` + Commands.commands[7] + `**`
        + `\nAs a final note, this bot is being rapidly developed with new features constantly being added,`
        + ` if you would like to recieve a private message when a new feature is live, type **${prefix}` + Commands.commands[27] + `** *true/false*.`
    ]

    if (user.tutorialStep == -1) {

        message.channel.send(GameTutorial.steps[0]);
        MAIN.sendHelpMessage(Commands.commands.indexOf(GameTutorial.expectedCommand[0]), message);

        await User.findOneAndUpdate({ id: user.id },
            {
                $set: {
                    activeTutorial: 0,
                    tutorialStep: 0,
                    previousTutorialStep: 0
                }
            }, function (err, doc, res) { });
        return 1;
    }
    else {
        if (user.activeTutorial == 0 || user.activeTutorial == -1) {

            if (command == MAIN.commandMap.get(Commands.commands[25])) {

                message.channel.send(GameTutorial.steps[user.tutorialStep]);
                let Index = Commands.commands.indexOf(GameTutorial.expectedCommand[user.tutorialStep]);
                MAIN.sendHelpMessage(Index, message);
                return 1;
            }
            else if (user.tutorialStep - user.previousTutorialStep == 1) {//If the user completed a previous step succesfuly, give the new prompt

                if (user.tutorialStep != GameTutorial.steps.length - 1) {

                    // message.channel.send({ embed: createTutorialEmbed(user.tutorialStep) })
                    message.channel.send(GameTutorial.steps[user.tutorialStep]);
                    MAIN.sendHelpMessage(Commands.commands.indexOf(GameTutorial.expectedCommand[user.tutorialStep]), message);
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
                    message.channel.send(GameTutorial.steps[user.tutorialStep]);
                    MAIN.sendHelpMessage(Commands.commands.indexOf(GameTutorial.expectedCommand[user.tutorialStep]), message);
                    if (!user.completedTutorials.includes(0)) {
                        user.completedTutorials.push(0);
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

                if (command == GameTutorial.specificCommand[user.tutorialStep]) {
                    let result = await GameTutorial.specificCommand[user.tutorialStep].call(null, message, params, user);
                    console.log("result: ", result)
                    console.log("expected: ", GameTutorial.expectedOutput[user.tutorialStep])
                    console.log()
                    if (result >= GameTutorial.expectedOutput[user.tutorialStep]) {
                        User.findOneAndUpdate({ id: user.id }, { $set: { tutorialStep: user.tutorialStep + 1 } }, function (err, doc, res) { });
                        setTimeout(gameTutorial, 1000, message, params, command);
                    }
                    return result;
                }
                else
                    return false;
            }
        }
        else {
            message.channel.send(`You are already doing ${tutorial[user.activeTutorial]}, to quit it type **${prefix}quitTutorial**`);
            return 1;
        }
    }
}
exports.gameTutorial = gameTutorial;

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
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[28] + "** *true/false*");
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
        message.channel.send("You must enter either true or false: **" + prefix + Commands.commands[28] + "** *true/false*");
        return -1;
    }
}
exports.setNotifyTutorials = setNotifyTutorials;

function createTutorialEmbed(tutorialStep) {

    let prompt = GameTutorial.steps[tutorialStep];
    let index = Commands.commands.indexOf(GameTutorial.expectedCommand[tutorialStep]);
    let fieldArray = new Array();

    if (index != -1) {
        for (let i = 0; i < Commands.example[index].length; i++) {

            fieldArray.push({
                name: `Example ${i + 1})`,
                value: prefix + Commands.example[index][i].substring(3)
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

//-22 meaning no matching tutorial was found
async function tutorialHandler(message, command, params, user) {

    switch (user.activeTutorial) {
        case 0:
            if (command == GameTutorial.specificCommand[user.tutorialStep] || command == gameTutorial) {

                return await gameTutorial(message, params, command);
            }
        case 1:

            break;
    }

    return -22;
}
exports.tutorialHandler = tutorialHandler;