const MAIN = require('./short-answer.js');

function suggest(message, params, user) {

    if (params == message.content) {
        return message.channel.send("You have to provide an actual suggestion!");
    }
    message.channel.send("Your suggestion has been forwarded!");
    Client.guilds.cache.get(MAIN.guildID).members.cache.get(MAIN.creatorID).user.send(`${user.displayName} is suggesting: ${params}`);
}
exports.suggest = suggest;