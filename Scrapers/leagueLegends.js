var needle = require('needle');
const cheerio = require('cheerio');
var MAIN = require('../scraper.js');
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

    let resp = await needle('get', `https://www.leagueofgraphs.com/summoner/${params[0]}/${params[1]}`);
    if (resp.body.includes('Not Found')) {
        console.log("not found")
        //  MAIN.Client.guilds.cache.get(params[2]).channels.cache.get(params[3]).send(`Could not find ${params[1]} on ${params[0]}`);
        return -1;
    }

    let soloRank = { champions: [] };
    let flexRank = { champions: [] };
    let total = { champions: [] };

    const $ = cheerio.load(resp.body);
    // const tester = $('div.txt.mainRankingDescriptionText div.leagueTier')
    // console.log(tester.text().trim());
    let DDD = new Date();
    var tester = $('div.txt.mainRankingDescriptionText').children().first();

    soloRank.soloRank = tester.text().trim();
    tester = tester.next().next();

    soloRank.top = tester.children().first().next().children().first().text().trim() + ` in ${params[0].toUpperCase()}`;
    tester = tester.next();

    soloRank.lp = `Current LP: ${tester.children().first().text().trim()}`;
    tester = tester.next().children().first();

    soloRank.wins = `Wins: ${tester.text().trim().split(' ')[1]}`;
    tester = tester.next().next();

    soloRank.losses = `Losses: ${tester.text().trim().split(' ')[1]}`;
    tester = tester.next().next();

    //medium-11 small-24 columns

    getQueueInfo(soloRank, $(`[data-tab-id=championsData-soloqueue] div.row`), $(`div#favchamps div.tabs-content [data-tab-id=championsData-soloqueue] table.data_table.sortable_table`).children().first()
        .children().first().next(), $(`div#profileKda [data-tab-id=championsData-soloqueue] div.number`).children().first());
    // getQueueInfo(flexRank, $(`[data-tab-id=championsData-flex] div.row`), $(`div#favchamps div.tabs-content [data-tab-id=championsData-flex] table.data_table.sortable_table`).children().first()
    //     .children().first().next(), $(`div#profileKda [data-tab-id=championsData-flex] div.number`).children().first());
    getQueueInfo(total, $(`[data-tab-id=championsData-all-queues] div.row`), $(`div#favchamps div.tabs-content [data-tab-id=championsData-all-queues] table.data_table.sortable_table`).children().first()
        .children().first().next(), $(`div#profileKda [data-tab-id=championsData-all-queues] div.number`).children().first());


    console.log(soloRank)
    //console.log(flexRank)
    //console.log(total);


    let embedArray = [];

    embedArray.push({name: "Ranked Solo", value: `${MAIN.getLeagueEmoji(soloRank.soloRank)} ${soloRank.soloRank.replace(' ', ' : ')}`})

    MAIN.prettyEmbed({guildID: params[2], channelID: params[3]}, `Here are ${params[1]}'s stats:`, embedArray, -1, -1, -1);


    console.log(((new Date() - DDD) / 1000));
    return 1;
}
exports.leagueStats = leagueStats;

const getQueueInfo = function (container, generalHTML, championHTML, kdaHTML) {

    totalGames = Number(generalHTML.children().first().children().first().children().first().text().trim());
    winRate = Number(generalHTML.children().first().next().children().first().children().first().text().trim().replace('%', ''));
    container.totalPlayed = `Total games: ${totalGames}`;
    container.winRate = `Winrate: ${winRate}%`;
    wonGames = Math.round(totalGames * (winRate / 100));
    container.wins = `Wins: ${wonGames}`;
    container.losses = `Losses: ${totalGames - wonGames}`;

    for (let x = 0; x < 3; x++) {
        let champion = {};
        let masteryHolder;
        let tempTester;
        if (x == 0) {
            tempTester = championHTML.children().first();
            //tester = tester.first(); 
        }
        else {
            championHTML = championHTML.next();
            tempTester = championHTML.children().first();
        }
        let specificChampHTML = tempTester.children().first().children().first();
        if (!specificChampHTML.attr('tooltip')) {
            if (x == 0) { container = -1; return -1; }
            else break;
        }
        masteryHolder = specificChampHTML.attr('tooltip').trim();
        masteryHolder = masteryHolder.substring(masteryHolder.indexOf('Level') + 6, masteryHolder.indexOf('<', +3))
        champion.mastery = masteryHolder;

        let numOfChild = specificChampHTML.next().children().length;
        specificChampHTML = specificChampHTML.next().children().first();
        champion.name = specificChampHTML.children().first().text().trim();

        specificChampHTML = numOfChild == 4 ? specificChampHTML.next().next().next().children().first().children().first() : specificChampHTML.next().next().children().first().children().first();
        champion.avgKills = specificChampHTML.text().trim();
        specificChampHTML = specificChampHTML.next();

        champion.avgDeaths = specificChampHTML.text().trim();
        specificChampHTML = specificChampHTML.next();
        champion.avgAssists = specificChampHTML.text().trim();

        tempTester = tempTester.next();
        champion.gamesPlayed = tempTester.attr('data-sort-value').trim();

        tempTester = tempTester.next().children().first().children().first();
        champion.winRate = Math.round(Number(tempTester.attr('data-value').trim()) * 100)

        //console.log(champion);
        container.champions.push(champion);
    }


    container.avgKills = kdaHTML.text().trim();
    kdaHTML = kdaHTML.next().next();
    container.avgDeaths = kdaHTML.text().trim();
    kdaHTML = kdaHTML.next().next();
    container.avgAssists = kdaHTML.text().trim();
}

//leagueStats(['na', 'thelastspark', '97354142502092800', '165845119818268672']);