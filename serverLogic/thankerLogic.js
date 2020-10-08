const isUrl = require('is-url');
const Guild = require('../Guild.js');
const MAIN = require('../scraper.js');
const needle = require('needle');


/** 
 * @params = [guildID, channelID, messagID, amount]
*/
const checkLink = async function (params) {

    let link = 0;
    let repo = 0;
    let guild = await MAIN.Client.guilds.fetch(params[0]);
    let channel = guild.channels.cache.get(params[1]);
    let message = await channel.messages.fetch(params[2]);

    let quoteCheck = message.content.split('\n');
    let messageContent = message.content;
    if (quoteCheck.length > 1) {

        for (let i = 0; i < quoteCheck.length; i++) {
            let check = quoteCheck[i];
            if (check[0] == '>')
                if (check[1] == ' ')
                    quoteCheck[i] = -1;
        }

        while (quoteCheck.includes(-1))
            quoteCheck.splice(quoteCheck.indexOf(-1), 1)

        messageContent = quoteCheck.join(' ').split(' ');

    }




    if (!Array.isArray(messageContent)) {
        messageContent = [messageContent];
    }
    let links = [];

    for (let string of messageContent) {
        if (isUrl(string)) {

            let stringy = string;
            let result = await needle('get', string)
                .catch(err => { console.log("caught thanker error link thanker") });
            if (result) {

                links.push(stringy)
            }
        }
    }


    let messages = await channel.messages.fetch({ before: message.id, limit: 100 });

    for (let i = 0; i < links.length; i++) {
        for (let messy of messages.values()) {

            if (messy.content.trim().replace(/[\n\r]/g, " ").split(' ').includes(links[i])) {
                links[i] = -1;
                repo++;
                break;
            }
        }
    }

    while (links.includes(-1))
        links.splice(links.indexOf(-1), 1);


    let resy = { newLinks: links.length, reposts: repo };
    console.log(resy);

    return resy;
}
exports.checkLink = checkLink;