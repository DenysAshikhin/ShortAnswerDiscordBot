var needle = require('needle');
const cheerio = require('cheerio');
var MAIN = require('../scraper.js');

/** 
 * @params = [zone, player, guildID, channelID]
 * @zone = 'steam', 'ps', 'xbox'
 * @return = -1 for invalid player/zone or 
 * [ [Gamemode, Rank, Division]..... ]
*/
async function rocketLeagueRanks(params) {
    //zones = [steam, ps, xbox]
    let resp = await needle('get', `https://rocketleague.tracker.network/profile/${params[0]}/${params[1]}`);
    if (resp.body.includes('We could not find your stats, please ensure your platform and name are correct')) {
        MAIN.Client.guilds.cache.get(params[2]).channels.cache.get(params[3]).send(`Could not find ${params[1]} on ${params[0]}`);
        return -1;
    }
    const $ = cheerio.load(resp.body);
    const CompleteTable = $('div.card-table-container').children();
    let finalContent = [];//[Gamemode, rank, division]
    for (let i = 0; i != CompleteTable.length; i++) {

        const season = CompleteTable[i];

        if (i == 0) {
            const row = season.children[3].children[3].children;

            for (let j = 3; j < row.length; j += 2) {
                const individual = row[j];
                const temp = cheerio.load(individual.children[2]);
                const specific = temp.text().split('\n').filter(value => value.length != 0);

                if (temp.html().includes("you have not played Rocket League")) {
                    finalContent.push([specific[0], 'Unranked']);
                }
                else {

                    const mmr = cheerio.load(individual.children[5]).text().trim().split("\n");
                    specific.push(mmr.splice(0, 1));
                    finalContent.push(specific);
                }
            }
        }
    }

    //finalContent.splice(0, 1);
    console.log(finalContent)
    let finalArray = [];

    for (let rank of finalContent) {
        rank[0] = rank[0].replace('Standard', '');
        if (rank[1] == 'Unranked')
            finalArray.push({ name: rank[0], value: `${MAIN.getEmoji(`RL${rank[1]}`)} ${rank[1]}` })
        else {
            //finalArray.push("YEEE")
            finalArray.push({ name: rank[0], value: `${MAIN.getEmoji(`RL${rank[1]}`)} ${rank[1]} : ${rank[2]} (${rank[3]})` })
        }
    }
    MAIN.prettyEmbed({ guildID: params[2], channelID: params[3] }, `Here are ${params[1]} 's stats:`, finalArray, -1, -1, -1);
    return -21;
    //return JSON.stringify({ finalContent: finalContent });
}
exports.rocketLeagueRanks = rocketLeagueRanks;
//rocketLeagueStats(['steam', 'thelastspark'])
