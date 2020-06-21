const puppeteer = require('puppeteer');
const net = require('net');
const TeemoJS = require('teemojs');

var config;
try {
    config = require('./config.json');
}
catch{
    console.log("prob on heroku")
}

var api = TeemoJS(config.leagueSecret);

var uniqid = require('uniqid');



const server = net.createServer(async (socket) => {
    //socket.end('goodbye\n');
    //socket.write("Hello")

    socket.on('data', async (data) => {
        console.log("Got data:");
        console.log(data.toString());
        let daty = data.toString().split(',')
        let result = await leagueStats(daty[0], daty[1], socket);

        socket.write(JSON.stringify({ status: result }));

    })

    socket.on('error', (err) => {
        // Handle errors here.
        console.log("Caught socket error");
    });
});

server.on('error', (err) => { console.log("Caught server error") })

// Grab an arbitrary unused port.
server.listen(0, '45.63.17.228', '33432', () => {
    console.log('opened server on', server.address());
    console.log(server.is)
});


server.on('connection', (socket) => { console.log("THERE WAS A CONNECTION!") })

const options = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu',
    ],
    headless: true
}

var puppeteerQueue = {
    backlog: [],
    active: new Map(),
    limit: 1,
    browser: null
};



async function getSummoner(zone, name) {

    let summoner = await api.req(zone, 'lol.summonerV4.getBySummonerName', name);
    //  console.log(summoner)
    return summoner;
}

async function leagueStats(summoner, zone, socket) {

    let summoneR = await getSummoner(zone, summoner);
    if (!summoneR) { message.channel.send(`${summoner} in the region *${zone}* does not exist, try again?`); return -1; }

    // let mastery = await getChampionMastery(zone, summoner, 5);
    // MAIN.prettyEmbed(message, `Here are the League of Legends stats for ${args[0]}`, mastery, -1, 1, 1);

    // getLeagueEntries(zone, summoner);
    //getMatchInfo(zone, summoner);

    crawlOPGG(socket, zone, summoner);
    return 1;
}

//Need to put this whole thing in a try catch just in case....
async function crawlOPGG(SOCKET, ZONE, summoner, looped) {

    let uniqueID;
    let username;
    let zone;
    let socket;

    if (puppeteerQueue.active.size < puppeteerQueue.limit) {

        uniqueID = uniqid();

        if (puppeteerQueue.backlog.length > 0) {
            let activy = puppeteerQueue.backlog.shift();
            username = activy.username.replace(/\s/g, '+');
            socket = activy.socket;
            zone = activy.zone;
            puppeteerQueue.active.set(uniqueID, { zone: zone, username: username, socket: activy.socket });
        }
        else if (!looped) {
            username = summoner.replace(/\s/g, '+');
            zone = ZONE;
            socket = SOCKET;
            puppeteerQueue.active.set(uniqueID, { zone: zone, username: username, socket: SOCKET });
        }

        for (person of puppeteerQueue.backlog) {
            person.position--;
            if (person.position == 0) person.position == -1;
            person.socket.write(JSON.stringify({ position: person.position }));
        }

    }
    else if (!looped) {
        SOCKET.write(JSON.stringify({ position: puppeteerQueue.backlog.length + 1 }));
        puppeteerQueue.backlog.push({ zone: ZONE, username: summoner, socket: SOCKET, position: puppeteerQueue.backlog.length + 1 });//later require a message so it can respond better.
        return 44;
    }

    console.log("STAAAAAART")
    let daty = new Date();
    let summonerTotalInfo = {};
    let summonerRankedSoloInfo = {};
    let summonerFlexInfo = {};
    let updateSocket = puppeteerQueue.active.get(uniqueID).socket;
    updateSocket.write(JSON.stringify({ position: -1 }));


    let url = `https://${zone}.op.gg/summoner/userName=${username}`;
    let champURL = `https://${zone}.op.gg/summoner/champions/userName=${username}`;

    if (puppeteerQueue.active.size > 1)
        while (!puppeteerQueue.browser) { await new Promise(resolve => setTimeout(resolve, 100)); }

    let browser = puppeteerQueue.browser ? puppeteerQueue.browser : await puppeteer.launch(options);
    if (!puppeteerQueue.browser) puppeteerQueue.browser = browser;

    console.log(`Step 1: ${(new Date() - daty) / 1000}`)


    let pages = await Promise.all([browser.newPage(), browser.newPage(), browser.newPage(), browser.newPage()])
    console.log(`Step 2: ${(new Date() - daty) / 1000}`)
    const page = pages[0];
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image') {
            req.abort();
        }
        else {
            req.continue();
        }
    });
    page.on('dialog', async dialog => {
        await dialog.dismiss();
    });
    await page.goto(url);
    console.log(`Step 3: ${(new Date() - daty) / 1000}`)
    const page1 = pages[1];
    const page2 = pages[2];
    const page3 = pages[3];

    let lastUpdate = await page.$eval(`div.LastUpdate span`, div => div.textContent);
    if (!lastUpdate.includes('a few seconds'))
        if (!lastUpdate.includes('a minute'))
            if (!lastUpdate.includes('2 minute'))
                if (!lastUpdate.includes('3 minute')) {
                    console.log("REFRESHED")
                    await page.click('#SummonerRefreshButton');
                    await page.waitFor(2000);
                    console.log(`Step 4: ${(new Date() - daty) / 1000}`)
                }

    let loadStats = [];
    loadStats.push(loadTotalStats(page, summonerTotalInfo));

    await Promise.all([page1.setRequestInterception(true), page2.setRequestInterception(true), page3.setRequestInterception(true)])
    console.log(`Step 5: ${(new Date() - daty) / 1000}`)
    {
        page1.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'media') {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        page1.on('dialog', async dialog => {
            await dialog.dismiss();
        });

        page2.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'media') {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        page2.on('dialog', async dialog => {
            await dialog.dismiss();
        });

        page3.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image' || req.resourceType() == 'media') {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        page3.on('dialog', async dialog => {
            await dialog.dismiss();
        });
    }//Interceptors

    let openURL = [];

    openURL.push(page1.goto(url)
        .then(async function (result) { await page1.click('#right_gametype_soloranked a.Link'); await page1.waitFor(500); loadStats.push(loadTotalStats(page1, summonerRankedSoloInfo)) }));
    openURL.push(page2.goto(url)
        .then(async function (result) { await page2.click('#right_gametype_flexranked a.Link'); await page2.waitFor(500); loadStats.push(loadTotalStats(page2, summonerFlexInfo)) }));
    openURL.push(page3.goto(champURL)
        .then(async function (result) { loadStats.push(loadChampionStats(page3, summonerTotalInfo)) }));

    await Promise.all(openURL);
    console.log(`Step 6: ${(new Date() - daty) / 1000}`)
    await Promise.all(loadStats);
    console.log(`Step 7: ${(new Date() - daty) / 1000}`)
    console.log("TOTAL INFO: ")
    let finalCollection = {
        ...summonerTotalInfo,
        ...summonerRankedSoloInfo,
        ...summonerFlexInfo
    }
    console.log(summonerTotalInfo);
    console.log("RANKED SOLO: ")
    console.log(summonerRankedSoloInfo);
    console.log("FLEX INFO: ");
    console.log(summonerFlexInfo);

    if ((puppeteerQueue.backlog.length == 0) && (puppeteerQueue.active.size == 1)) {
        console.log("FIRST")
        puppeteerQueue.active.delete(uniqueID);
        puppeteerQueue.browser = null;
        await browser.close();
    }
    else if ((puppeteerQueue.backlog.length == 0) && (puppeteerQueue.active.size > 1)) {
        console.log("SECOND")
        puppeteerQueue.active.delete(uniqueID);
    }
    else if ((puppeteerQueue.backlog.length > 0)) {
        console.log("THIRD")
        puppeteerQueue.active.delete(uniqueID);
        crawlOPGG(null, null, null, true);
    }

    console.log("FINISHED::   ", uniqueID);

    await socket.write(JSON.stringify({ totalStats: summonerTotalInfo }));
    await new Promise(resolve => setTimeout(resolve, 100));
    await socket.write(JSON.stringify({ rankedSolo: summonerRankedSoloInfo }));
    await new Promise(resolve => setTimeout(resolve, 100));
    await socket.write(JSON.stringify({ rankedFlex: summonerFlexInfo }));
    return 1;//Return the actual object here.
}

async function loadTotalStats(page, summonerInfo) {
    for (let i = 0; i < 5; i++) {
        try {
            await page.click('div.GameMoreButton.Box a.Button');
            await page.waitFor(1250);
        }
        catch (err) {
            break;
        }
    }

    let some = await page.$(`div.WinRatioTitle span.total`)
    if (!some) return await page.close();

    try {

        let statsArray = [page.$eval(`div.WinRatioTitle span.total`, div => div.innerHTML), page.$eval(`div.WinRatioTitle span.win`, div => div.innerHTML),
        page.$eval(`div.WinRatioTitle span.lose`, div => div.innerHTML), page.$eval(`.Information .Name`, divs => divs.innerHTML),
        page.$$eval(`.PastRankList [Title]`, uls => uls.map(item => item.textContent.trim())), page.$eval(`div.KDA span.Kill`, div => div.innerHTML),
        page.$eval(`div.KDA span.Death`, div => div.innerHTML), page.$eval(`div.KDA span.Assist`, div => div.innerHTML),
        page.$$eval(`div.Content div.Name`, uls => uls.map(item => item.textContent.trim()))];

        let result = await Promise.all(statsArray);
        summonerInfo.totalGames = result[0];
        summonerInfo.totalWins = result[1];
        summonerInfo.totalLoses = result[2];
        summonerInfo.name = result[3];
        summonerInfo.previousRanks = result[4];
        summonerInfo.averageKills = result[5];
        summonerInfo.averageDeaths = result[6];
        summonerInfo.averageAssists = result[7];
        summonerInfo.championNames = result[8];
    }
    catch (err) {
        console.log(err)
        console.log("Error loading one of the totalStats pages???")
    }

    await page.close();
    // let champyName = await page.$$eval(`div.Content div.Name`, uls => uls.map(item => item.textContent.trim()));
    // summonerInfo.championNames = champyName.slice(0, 3);
    // await page.close();
}

async function loadChampionStats(page, summonerInfo) {

    let champArray = [page.$$eval(`div.tabItem.normal td.ChampionName.Cell`, uls => uls.map(result => result.textContent.trim())),
    page.$$eval(`div.tabItem.normal span.WinRatio`, uls => uls.map(result => result.textContent.trim())),
    page.$$eval(`div.tabItem.normal div.Text.Left`, uls => uls.map(result => result.innerHTML.trim())),
    page.$$eval(`div.tabItem.normal div.Text.Right`, uls => uls.map(result => result.innerHTML.trim())),
    page.$$eval(`div.tabItem.normal span.Kill`, uls => uls.map(result => result.textContent.trim())),
    page.$$eval(`div.tabItem.normal span.Death`, uls => uls.map(result => result.textContent.trim())),
    page.$$eval(`div.tabItem.normal span.Assist`, uls => uls.map(result => result.textContent.trim()))
    ];

    let result = await Promise.all(champArray);

    let finalRatios = [];
    for (ratio of result[1]) {

        if (ratio == '100%') {
            let win = result[2].shift();
            finalRatios.push({
                champion: result[0].shift(), wins: Number(win.substring(0, win.indexOf('W'))), losses: 0, ratio: ratio, kills: result[4].shift(),
                deaths: result[5].shift(), assists: result[6].shift()
            });
        }
        else if (ratio == '0%') {
            let loose = result[3].shift();
            finalRatios.push({
                champion: result[0].shift(), losses: Number(loose.substring(0, loose.indexOf('L'))), wins: 0, ratio: ratio, kills: result[4].shift(),
                deaths: result[5].shift(), assists: result[6].shift()
            });
        }
        else {
            let loose = result[3].shift();
            let win = result[2].shift();
            finalRatios.push({
                champion: result[0].shift(), losses: Number(loose.substring(0, loose.indexOf('L'))), wins: Number(win.substring(0, win.indexOf('W'))), ratio: ratio,
                kills: result[4].shift(), deaths: result[5].shift(), assists: result[6].shift()
            });
        }
    }

    summonerInfo.totalChamps = finalRatios;
    await page.close();
}