const MAIN = require('./short-answer.js');
const Guild = require('./Guild.js');

function suggest(message, params, user) {

    if (params == message.content) {
        return message.channel.send("You have to provide an actual suggestion!");
    }
    message.channel.send("Your suggestion has been forwarded!");
    MAIN.Client.guilds.cache.get(MAIN.guildID).members.cache.get(MAIN.creatorID).user.send(`${user.displayName} is suggesting: ${params}`);
}
exports.suggest = suggest;

const suggestGame = async function (message, params, user) {

    if (message.content.split(" ").length < 2)
        return message.channel.send("You have to provide the title of the game to add!");

    let arg = message.content.split(" ").slice(1).join(" ");


    if (user.suggestionBanDate != '0-0-0000')
        if (MAIN.findFurthestDate(MAIN.getDate(), user.suggestionBanDate) == MAIN.getDate())
            return message.channel.send(`You are currently banned from making new suggestion until **${user.suggestionBanDate}**`);

    let guild = await MAIN.findGuild({ id: MAIN.gameSuggest.guildID });


    let searchy = guild.gameSuggest.find(element => element.userID == user.id);
    if (searchy)
        return message.channel.send(`You have already suggested *${searchy.game}*, please wait until your previous suggestion has been reviewed`
            + ` until making a new one.`);


    guild.gameSuggest.push({ guildID: message.guild.id, userID: message.author.id, displayName: user.displayName, game: arg });
    Guild.findOneAndUpdate({ id: MAIN.gameSuggest.guildID }, { $set: { gameSuggest: guild.gameSuggest } }, function (err, doc, res) {
    });
    message.channel.send(`**${arg}** has been added to the suggestion queue. You can see the queue in real time at`
        + ` ${(await MAIN.Client.guilds.cache.get('728358459791245345').channels.cache.get('728360459920736368').createInvite()).url}`);
    
    await MAIN.sleep(1000);
    MAIN.refreshSuggestQueue(null);
}
exports.suggestGame = suggestGame;

const officialServer = async function (message, params, user) {

    let invite = await MAIN.Client.guilds.cache.get('728358459791245345').channels.cache.get('728358460215001270').createInvite();
    message.channel.send(invite.url);
}
exports.officialServer = officialServer;

const acceptSuggestion = async function (message, params, user) {

    if (user.id != MAIN.creatorID)
        return message.channel.send("Only the creator can use this command!");

    let arg = message.content.split(" ").slice(1).join(" ");

    MAIN.modifiedSuggestionAccept(arg);
    message.delete();
}
exports.acceptSuggestion = acceptSuggestion;