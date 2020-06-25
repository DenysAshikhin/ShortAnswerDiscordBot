var needle = require('needle');
const cheerio = require('cheerio')

/** 
 * @params = [zone, player]
 * @zone = 'steam', 'ps', 'xbox'
 * @return = -1 for invalid player/zone or 
 * [ [Gamemode, Rank, Division]..... ]
*/
async function rocketLeagueStats(params) {
    //zones = [steam, ps, xbox]
    let resp = await needle('get', `https://rocketleague.tracker.network/profile/${params[0]}/${params[1]}`);

    if (resp.body.includes('We could not find your stats, please ensure your platform and name are correct')) {
        console.log("Player not found");
        return -1;
    }

    const $ = cheerio.load(resp.body);
    const CompleteTable = $('div.card-table-container').children();
    let finalContent = [];//[Gamemode, rank, division]

    for (let i = 0; i != CompleteTable.length; i++) {

        const season = CompleteTable[i];

        if (i == 0) {
            const row = season.children[3].children[3].children;

            for (let j = 1; j < row.length; j += 2) {
                const individual = row[j];
                const temp = cheerio.load(individual.children[2]);
                const specific = temp.text().split('\n').filter(value => value.length != 0);
                if (temp.html().includes("you have not played Rocket League")) {
                    finalContent.push([specific[0], 'Unranked']);
                }
                else {
                    finalContent.push(specific);
                }
            }
        }
    }
    return JSON.stringify({ finalContent: finalContent });
}
exports.rocketLeagueStats = rocketLeagueStats;