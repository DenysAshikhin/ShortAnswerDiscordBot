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
        MAIN.Client.guilds.cache.get(params[2]).channels.cache.get(params[3]).send(`Could not find ${params[1]} on ${params[0]}`);
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


    //console.log(soloRank)
    //console.log(flexRank)
    //console.log(total);


    let embedArray = [];

    embedArray.push({
        name: `${MAIN.getEmoji("LOL" + soloRank.soloRank.substring(0, soloRank.soloRank.indexOf(' ')))} Ranked Solo - ${soloRank.top}`,
        value: `${soloRank.soloRank} (${soloRank.lp.substring(soloRank.lp.indexOf(' ') + 1).replace(': ', ':')})\n\n`
            + `Winrate: ${Math.round(Number(soloRank.winRate.substring(soloRank.winRate.indexOf(' ') + 1, soloRank.winRate.indexOf('%'))))}% of ${soloRank.totalPlayed.substring(soloRank.totalPlayed.lastIndexOf(' ') + 1)} games\n\n`
            + `Average Kills: ${soloRank.avgKills}\nAverage Deaths: ${soloRank.avgDeaths}\nAverage Assists: ${soloRank.avgAssists}\n`
            + `Average KDA: ${((Number(soloRank.avgKills) + Number(soloRank.avgAssists)) / Number(soloRank.avgDeaths)).toFixed(2)}`
    });


    for (let i = 0; i < soloRank.champions.length; i++) {

        switch (i) {
            case 0:
                embedArray.push({
                    name: `${MAIN.getEmoji(`FLARE${soloRank.champions[i].mastery}`)} ${soloRank.champions[i].name} Ranked Solo Main`, value: `${
                        `Mastery Level: ${soloRank.champions[i].mastery}\n\nWinrate: ${Math.round(Number(soloRank.champions[i].winRate))}% of ${soloRank.champions[i].gamesPlayed} games\n\n`
                        + `Average Kills: ${soloRank.champions[i].avgKills}\nAverage Deaths: ${soloRank.champions[i].avgDeaths}\nAverage Assists: ${soloRank.champions[i].avgAssists}\n`
                        + `Average KDA: ${((Number(soloRank.champions[i].avgKills) + Number(soloRank.champions[i].avgAssists)) / Number(soloRank.champions[i].avgDeaths)).toFixed(2)}`}`
                });
                embedArray.push({ name: '** **', value: "** **" })
                break;
            case 1:
                embedArray.push({
                    name: `${MAIN.getEmoji(`FLARE${soloRank.champions[i].mastery}`)} ${soloRank.champions[i].name} Ranked Solo Secondary`, value: `${
                        `Mastery Level: ${soloRank.champions[i].mastery}\n\nWinrate: ${Math.round(Number(soloRank.champions[i].winRate))}% of ${soloRank.champions[i].gamesPlayed} games\n\n`
                        + `Average Kills: ${soloRank.champions[i].avgKills}\nAverage Deaths: ${soloRank.champions[i].avgDeaths}\nAverage Assists: ${soloRank.champions[i].avgAssists}\n`
                        + `Average KDA: ${((Number(soloRank.champions[i].avgKills) + Number(soloRank.champions[i].avgAssists)) / Number(soloRank.champions[i].avgDeaths)).toFixed(2)}`}`
                });
                break;
            case 2:

                break;
        }
    }

    if ((soloRank.champions.length == 0))
        return MAIN.Client.guilds.cache.get(params[2]).channels.cache.get(params[3]).send(`You need to play at least 1 different champions for Solo Ranked before seeing your stats!`);

    embedArray.push({
        name: `Ranked + Standard`,
        value: `Winrate: ${Math.round(Number(total.winRate.substring(total.winRate.indexOf(' ') + 1, total.winRate.indexOf('%'))))}% of ${total.totalPlayed.substring(total.totalPlayed.lastIndexOf(' ') + 1)} games\n\n`
            + `Average Kills: ${total.avgKills}\nAverage Deaths: ${total.avgDeaths}\nAverage Assists: ${total.avgAssists}\n`
            + `Average KDA: ${((Number(total.avgKills) + Number(total.avgAssists)) / Number(total.avgDeaths)).toFixed(2)}`,
        inline: false
    });


    for (let i = 0; i < total.champions.length; i++) {

        switch (i) {
            case 0:
                embedArray.push({
                    name: `${MAIN.getEmoji(`FLARE${total.champions[0].mastery}`)} ${total.champions[0].name} Ranked + Standard Main`, value: `${
                        `Mastery Level: ${total.champions[0].mastery}\n\nWinrate: ${Math.round(Number(total.champions[0].winRate))}% of ${total.champions[0].gamesPlayed} games\n\n`
                        + `Average Kills: ${total.champions[0].avgKills}\nAverage Deaths: ${total.champions[0].avgDeaths}\nAverage Assists: ${total.champions[0].avgAssists}\n`
                        + `Average KDA: ${((Number(total.champions[0].avgKills) + Number(total.champions[0].avgAssists)) / Number(total.champions[0].avgDeaths)).toFixed(2)}`}`
                });
                break;
            case 1:
                embedArray.push({
                    name: `${MAIN.getEmoji(`FLARE${total.champions[1].mastery}`)} ${total.champions[1].name} Ranked + Standard Main`, value: `${
                        `Mastery Level: ${total.champions[1].mastery}\n\nWinrate: ${Math.round(Number(total.champions[1].winRate))}% of ${total.champions[1].gamesPlayed} games\n\n`
                        + `Average Kills: ${total.champions[1].avgKills}\nAverage Deaths: ${total.champions[1].avgDeaths}\nAverage Assists: ${total.champions[1].avgAssists}\n`
                        + `Average KDA: ${((Number(total.champions[1].avgKills) + Number(total.champions[1].avgAssists)) / Number(total.champions[1].avgDeaths)).toFixed(2)}`}`
                });
                break;
        }
    }


    MAIN.prettyEmbed({ guildID: params[2], channelID: params[3] }, embedArray, {
        description: `Here are ${params[1]} 's stats:`, modifier: 1,
        maxLength: 1000, cutOff: 1
    });
    //MAIN.prettyEmbed({ guildID: params[2], channelID: params[3] }, `Here are ${params[1]} 's stats:`, embedArray, -1, -1, 1, null, null, null, 1000, 1);
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

//leagueStats(['na', 'hailfire123', '97354142502092800', '165845119818268672']);