var needle = require('needle');
const cheerio = require('cheerio')
var config = require('../config.json');
const TeemoJS = require('teemojs');
var api = TeemoJS(config.leagueSecret);

async function getSummoner(zone, name) {

    let summoner = await api.req(zone, 'lol.summonerV4.getBySummonerName', name);
    return summoner;
}




/** 
 * @params = [zone, player]
 * @zone = 'steam', 'ps', 'xbox'
 * @return = -1 for invalid player/zone or 
 * [ [Gamemode, Rank, Division]..... ]
*/
async function leagueStats(params, socket) {

    let summoneR = await getSummoner(params[1], params[0]);
    if (!summoneR) { return -1; }

















    return 1;
}
exports.leagueStats = leagueStats;