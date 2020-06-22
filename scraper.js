const puppeteer = require('puppeteer');
const net = require('net');
const TeemoJS = require('teemojs');
const TwitchClient = require('twitch').default;
const twitchConfig = require('./twitch.json');
const fs = require('fs');
//make the authentication in short-answer first, then load all other dependencies???
var twitchClient;
var config;
try {
    config = require('./config.json');
}
catch{
    console.log("prob on heroku")
}

var commandMap = new Map();


{
    commandMap.set('league_stats', leagueStats);
    commandMap.set('follow_twitch_channel', followTwitchChannel);
    commandMap.set('unfollow_twitch_channel', unfollowTwitchChannel);
    commandMap.set('view_twitch_follows', viewTwitchFollows);
    commandMap.set('show_channel_twitch_links', showChannelTwitchLinks);
    commandMap.set('remove_channel_twitch_link', removeChannelTwitchLink);
    commandMap.set('link_twitch', linkTwitch);
    commandMap.set('link_channel_with_twitch', linkChannelWithTwitch);
    commandMap.set('check_guild_twitch_streams', checkGuildTwitchStreams);
    commandMap.set('check_user_twitch_streams', checkUsersTwitchStreams);
}


var api = TeemoJS(config.leagueSecret);
var uniqid = require('uniqid');

const server = net.createServer(async (socket) => {

    socket.on('data', async (data) => {
        //console.log("Got data:");
        //console.log(data.toString());
        let dataParsed = JSON.parse(data.toString());

        let result = await commandMap.get(dataParsed.command).apply(null, [dataParsed.params, socket]);
        console.log('result:')
        console.log(result);
        if (!isNaN(result))
            socket.write(JSON.stringify({ status: result }));
        else
            socket.write(result);
    })
    socket.on('error', (err) => {
        // Handle errors here.
        console.log(err);
        console.log("Caught socket error");
    });

    socket.on('close', (had_error) => {
        console.log("socket closed");
        console.log(had_error)
        socket.destroy();
        console.log("destroyed the closed socket?");
    })
});

server.on('error', (err) => { console.log("Caught server error") })

// Grab an arbitrary unused port.
server.listen(0, '45.63.17.228', '33432', () => {
    console.log('opened server on', server.address());
});
server.on('connection', (socket) => { })


async function twitchInitiliasation() {

    let clienty = twitchConfig.twitchClient;
    let clientSecret = twitchConfig.twitchSecret;
    let accessy = twitchConfig.twitchAccess;
    let refreshy = twitchConfig.twitchRefresh;
    let expiry = twitchConfig.expiryTimestamp;

    twitchClient = TwitchClient.withCredentials(clienty, accessy, undefined, {
        clientSecret,
        refreshToken: refreshy,
        expiry: expiry === null ? null : new Date(expiry),
        onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
            const newTokenData = {
                ...twitchConfig,
                twitchAccess: accessToken,
                twitchRefresh: refreshToken,
                expiryDate: expiryDate === null ? null : expiryDate.getTime()
            };
            await fs.promises.writeFile('./twitch.json', JSON.stringify(newTokenData), 'UTF-8');
        }
    });
    exports.twitchClient = twitchClient;
}
twitchInitiliasation();

async function checkTwitch() {
    try {
        checkUsersTwitchStreams(await getUsers());
        checkGuildTwitchStreams(await getGuilds());
    }
    catch (err) {
        console.log(err);
        console.log("Error with twitch checks!");
    }
}
//setInterval(checkTwitch, 60 * 1000);




//params = [guilds] -> guilds contain guild.channelTwitch, guild.twitchNotifications, guild.id
async function checkGuildTwitchStreams(params, socket) {

    let sendArray = [];
    let promiseArray = [];
    for (guild of params[0]) {
        console.log(guild);
        for (channel1 of guild.channelTwitch) {
            let channel = channel1;
            let channelByID = getTwitchChannelByID(channel[0])
                .then(async (streamer) => {
                    let stream = await streamer.getStream();

                    if (stream) {

                        let streamDate = new Date(stream._data.started_at);
                        let found = false;
                        let index = -1;

                        if (!guild.twitchNotifications) guild.twitchNotifications = [];

                        for (let i = 0; i < guild.twitchNotifications.length; i++) {
                            if (guild.twitchNotifications[i][0] == stream._data.user_id) {
                                index = i;

                                let previousTime = new Date(guild.twitchNotifications[i][1]);
                                if ((previousTime - streamDate) == 0) {
                                    found = true;
                                }
                                break;
                            }
                        }

                        if (!found) {

                            if (index != -1)
                                guild.twitchNotifications[index] = [stream._data.user_id, stream._data.started_at];
                            else
                                guild.twitchNotifications.push([stream._data.user_id, stream._data.started_at]);

                            sendArray.push({
                                twitchNotifications: guild.twitchNotifications, guildID: guild.id,
                                alertMessage: `${stream._data.user_name} is live at: https://www.twitch.tv/${stream._data.user_name}`,
                                channelID: channel[1]
                            });
                        }
                    }
                });
            promiseArray.push(channelByID);
        }
    }
    await Promise.all(promiseArray);
    return JSON.stringify({ completeArray: sendArray });
}
exports.checkGuildTwitchStreams = checkGuildTwitchStreams;

//params = [users] -> users contain user.twitchFollows, user.twitchNotifications, user.id
async function checkUsersTwitchStreams(params, socket) {
    console.log(params)
    let sendArray = [];
    let promiseArray = [];
    for (user1 of params[0]) {
        for (channel of user1.twitchFollows) {
            let USER = user1;
            let twitchByChannel = getTwitchChannelByID(channel)
                .then(async (streamer) => {
                    let stream = await streamer.getStream();
                    if (stream) {
                        let streamDate = new Date(stream._data.started_at);
                        let found = false;
                        let index = -1;

                        if (!USER.twitchNotifications) USER.twitchNotifications = [];

                        for (let i = 0; i < USER.twitchNotifications.length; i++) {
                            console.log(USER.twitchNotifications[i][0])
                            console.log(stream._data.user_id)
                            if (USER.twitchNotifications[i][0] == stream._data.user_id) {
                                index = i;

                                let previousTime = new Date(USER.twitchNotifications[i][1]);
                                if ((previousTime - streamDate) == 0)
                                    found = true;
                                break;
                            }
                        }
                        if (!found) {

                            if (index != -1)
                                USER.twitchNotifications[index] = [stream._data.user_id, stream._data.started_at];
                            else
                                USER.twitchNotifications.push([stream._data.user_id, stream._data.started_at]);

                            sendArray.push({
                                twitchNotifications: USER.twitchNotifications, userID: USER.id,
                                alertMessage: `${stream._data.user_name} is live at: https://www.twitch.tv/${stream._data.user_name}`
                            });
                        }
                    }
                })
            promiseArray.push(twitchByChannel);
        }
    }
    await Promise.all(promiseArray);
    console.log(sendArray);
    return JSON.stringify({ completeArray: sendArray });
}
exports.checkUsersTwitchStreams = checkUsersTwitchStreams;






//params = [streamer, channelTwitch, channelID] -> Guild.channelTwitch
async function linkChannelWithTwitch(params, socket) {

    let streamer = await getTwitchChannel(params[0])
        .catch((err) => { console.log("caught error in linkChannelWithTwitch") });

    if (!streamer) return -1;

    for (channel of params[1]) {
        if (channel[1] == params[2]) {
            if (channel[0] == streamer._data.id) {
                return -2;
            }
        }
    }
    params[1].push([streamer._data.id, params[2]])
    return JSON.stringify({ channelTwitch: params[1] });
}
exports.linkChannelWithTwitch = linkChannelWithTwitch;

//params = [streamer, twitchFollows]
async function linkTwitch(params, socket) {

    let args = params[0];

    let streamer = await getTwitchChannel(args);
    if (!streamer) return -1;

    let follows = await streamer.getFollows();
    let followIDs = [];
    if (follows)
        for (chan of follows.data)
            followIDs.push(chan._data.to_id);

    let goodArray = [];

    for (channy of followIDs) {
        let tester = await getTwitchChannelByID(channy);

        if (tester)
            goodArray.push(channy)
    }

    if (goodArray.length > 0)
        return JSON.stringify({ goodArray: goodArray, streamer: streamer });
    return JSON.stringify({ streamer: streamer });
}
exports.linkTwitch = linkTwitch;

//params = [streamer]
async function removeChannelTwitchLink(params, socket) {

    let streamer = await getTwitchChannel(params[0]).catch((err) => { console.log("caught error in removeChannelTwitchLink"); })
    if (!streamer) return -1;
    else return JSON.stringify({ streamer: streamer });
}
exports.removeChannelTwitchLink = removeChannelTwitchLink;

//params = [channelTwitch] ->Guild.channelTwitch
async function showChannelTwitchLinks(params, socket) {

    let promiseArray = [];

    for (follow of params[0]) {
        promiseArray.push(getTwitchChannelByID(follow[0]));
    }

    return JSON.stringify({ promiseArray: await Promise.all(promiseArray) });
}
exports.showChannelTwitchLinks = showChannelTwitchLinks;

//params = [twitchFollows]
async function viewTwitchFollows(params, socket) {

    let promiseArray = [];

    for (follow of params[0])
        promiseArray.push(getTwitchChannelByID(follow));

    let finishedPromises = await Promise.all(promiseArray);
    finishedPromises.sort((a, b) => { return b._data.view_count - a._data.view_count });
    let finalArray = [];

    for (promisy of finishedPromises) {

        let streamy = await isStreamLive(promisy._data.id);
        if (streamy)
            finalArray.push({ name: 'Online', value: `<${promisy._data.display_name} is currently live with= ${streamy._data.viewer_count} Viewers!>\n` });
        else
            finalArray.push({ name: 'Offline', value: `<${promisy._data.display_name} - Total Views=${promisy._data.view_count}>\n` });
    }

    finalArray.sort((a, b) => b.name.localeCompare(a.name));
    return JSON.stringify({ finalArray: finalArray });
}
exports.viewTwitchFollows = viewTwitchFollows;

//params = [channeltoUnfollow, twitchFollows, skipValidation]
async function unfollowTwitchChannel(params, socket) {

    let args = params[0];

    if (params.length == 2) {

        let promiseArray = [];

        for (follow of params[1])
            promiseArray.push(getTwitchChannelByID(follow));

        let finishedPromises = await Promise.all(promiseArray);

        let found = finishedPromises.find(element => element._data.display_name == args);

        let channelNames = [];
        let internalArray = [];

        for (channel of finishedPromises) {
            channelNames.push(channel._data.display_name);
            internalArray.push({ looped: true, channel: channel.id, name: channel._data.display_name });
        }

        console.log(!!found)
        console.log(found)

        if (!found) {
            return (JSON.stringify({ channelNames: channelNames, internalArray: internalArray }));
        }
        else {
            params[1].splice(params[1].indexOf(args), 1);
            return JSON.stringify({ twitchFollows: params[1], name: args });
        }
    }
    else {
        console.log("inside of else?")
        params[1].splice(params[1].indexOf(args), 1);
        return JSON.stringify({ twitchFollows: params[1], name: args });
    }
}
exports.unfollowTwitchChannel = unfollowTwitchChannel;

//params = [channel to follow, twitchFollows, linkedTwitch]
async function followTwitchChannel(params, socket) {

    let args = params[0];

    let targetChannel = await getTwitchChannel(args);
    if (!targetChannel) return -1;


    if (params[1].includes(targetChannel._data.id)) return -2;
    if (params[2] == (targetChannel._data.id)) return -3;

    params[1].push(targetChannel._data.id);
    socket.write(JSON.stringify({ result: params[1], targetChannelName: targetChannel._data.display_name }))
    return 1;
}
exports.followTwitchChannel = followTwitchChannel;

async function isStreamLive(id) {
    return await twitchClient.helix.streams.getStreamByUserId(id);
}

async function getTwitchChannel(streamer) {
    const user = await twitchClient.helix.users.getUserByName(streamer);
    return user;
}

async function getTwitchChannelByID(id) {
    const user = await twitchClient.helix.users.getUserById(id);
    return user;
}

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

async function leagueStats(params, socket) {

    let summoneR = await getSummoner(params[1], params[0]);
    if (!summoneR) { return -1; }

    crawlOPGG(socket, params[1], params[0]);
    return 1;
}

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