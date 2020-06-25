var needle = require('needle');
const cheerio = require('cheerio');
//var MAIN = require('../scraper.js');
var config = require('../config.json');
const TeemoJS = require('teemojs');
var api = TeemoJS(config.leagueSecret);

async function getSummoner(zone, name) {

    let summoner = await api.req(zone, 'lol.summonerV4.getBySummonerName', name);
    return summoner;
}




/** 
 * @params = [zone, player, guildID, channelID]
 * @zone = 'steam', 'ps', 'xbox'
 * @return = -1 for invalid player/zone or 
 * [ [Gamemode, Rank, Division]..... ]
*/
async function leagueStats(params, socket) {

    // let summoneR = await getSummoner(params[1], params[0]);
    // if (!summoneR) { return -1; }



    let resp = await needle('get', `https://www.leagueofgraphs.com/summoner/${params[0]}/${params[1]}`);
    if (resp.body.includes('Not Found')) {
        console.log("not found")
        //  MAIN.Client.guilds.cache.get(params[2]).channels.cache.get(params[3]).send(`Could not find ${params[1]} on ${params[0]}`);
        return -1;
    }


    let complete = {};

    const $ = cheerio.load(resp.body);
    // const tester = $('div.txt.mainRankingDescriptionText div.leagueTier')
    // console.log(tester.text().trim());


    var tester = $('div.txt.mainRankingDescriptionText').children().first();
    complete.soloRank = tester.text().trim();
    tester = tester.next().next();
    complete.top = tester.children().first().next().children().first().text().trim() + ` in ${params[0].toUpperCase()}`;


    console.log(tester.children().first().next().children().first().text().trim());



    //const CompleteTable = $('div#MainContent div.row div.medium-13.small-24.columns div.box.box-padding-10.summoner-rankings div.best-league div.relative div.row div.medium-24.small-24.columns div.img-align-block div.txt.mainRankingDescriptionText div.leagueTier');
    //console.log(CompleteTable.html())



    console.log(complete)
    return 1;
}
exports.leagueStats = leagueStats;
leagueStats(['na', 'Hailfire123']);