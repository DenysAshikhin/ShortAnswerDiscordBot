const MAIN = require('./short-answer.js');
const Commands = require('./commands.json');


function helpStats(message, params, user) {


    let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = MAIN.Embed.title + ` Stats Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(2))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}
exports.helpStats = helpStats;

function helpMusic(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = MAIN.Embed.title + ` Music Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(4))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i], inline: true });

    message.channel.send({ embed: newEmbed });
}
exports.helpMusic = helpMusic;

function gameHelp(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = MAIN.Embed.title + ` Game Commands`,
        newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: newEmbed });
}
exports.gameHelp = gameHelp;

function generalHelp(message, params, user) {

    const args = message.content.split(" ").slice(1).join(" ");

    if (!args) {

        let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
        newEmbed.timestamp = new Date();
        newEmbed.title = MAIN.Embed.title + ` General Help`;
        newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;
        newEmbed.fields = [
            { name: "Games", value: "", inline: true },
            { name: "Stats", value: "", inline: true },
            { name: "Miscellaneous", value: "", inline: true },
            { name: "Music", value: "", inline: true },
            { name: "Admins", value: "", inline: true },
            { name: "Quality of Life", value: "", inline: true },
            { name: "Help", value: "", inline: true },
            { name: "General", value: "", inline: true },
            { name: "Tutorials", value: "", inline: true },
            { name: "Bugs/Suggestions", value: "", inline: true },
        ];

        for (tag of MAIN.tags) {

            let counter = 0;
            for (let i = 0; i < Commands.commands.length; i++) {

                if (Commands.subsection[i].includes(tag)) {
                    counter++;
                    newEmbed.fields[tag - 1].value += counter + ") " + Commands.commands[i] + "\n"
                }
            }
        }

        return message.channel.send({ embed: newEmbed });
    }

    if (params.index) {

        let examples = "```md\n";

        for (example of Commands.example[params.index]) {

            let index = example.indexOf(" ");
            examples += `<${example.slice(0, index)}` + prefix + `${example.slice(index + 1)}>\n\n`;
        }
        examples += "```";

        let prompt = `${Commands.explanation[params.index]}` + `${examples}`;
        return message.channel.send(prompt);
    }
    else {

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < Commands.commands.length; i++) {

            promptArray.push(Commands.commands[i]);
            internalArray.push({ index: i });
        }
        let query = args;
        console.log(args)
        return MAIN.generalMatcher(message, query, user, promptArray, internalArray, generalHelp, `Enter the number of the command you wish to learn more about!`);
    }
}
exports.generalHelp = generalHelp;

function gameHelp(message, params, user) {

    let newEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    newEmbed.timestamp = new Date();
    newEmbed.title = MAIN.Embed.title + ` Game Commands`;
    newEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;


    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(1))
            newEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i], inline: true });

    message.channel.send({ embed: newEmbed });
}
exports.gameHelp = gameHelp;

function helpMiscellaneous(message) {

    let miscEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    miscEmbed.timestamp = new Date();
    miscEmbed.title = MAIN.Embed.title + ` Miscellaneous Commands`;
    miscEmbed.description = `You can find out more information about any command by typing ${prefix}help *Command*`;

    for (let i = 0; i < Commands.commands.length; i++)
        if (Commands.subsection[i].includes(3))
            miscEmbed.fields.push({ name: prefix + Commands.commands[i], value: Commands.explanation[i] })

    message.channel.send({ embed: miscEmbed });
}
exports.helpMiscellaneous = helpMiscellaneous;