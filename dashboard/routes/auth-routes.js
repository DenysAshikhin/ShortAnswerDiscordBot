const express = require('express');

const router = express.Router();
const CONFIG = require('../../config.json');
const Guild = require('../../Guild');
const MAIN = require('../../scraper.js');
const User = require('../../User');
const authClient = require('../modules/auth-client.js');
const sessions = require('../modules/sessions.js');
const { validateKey } = require('../modules/middleware.js');
// const music = require('../../music.js');
var Spotify = require('enhanced-spotify-api');
var needle = require('needle');
let ytdl = require("ytdl-core");
const ytsr = require('ytsr');
const Fuse = require('fuse.js');

router.get('/login', function (req, res) {

    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=689315272531902606&redirect_uri=${MAIN.REDIRECT_URL}/auth&response_type=code&scope=identify guilds&prompt=none`);
});

router.get('/auth', async function (req, res) {

    try {
        const code = req.query.code;

        console.log('did /auth')

        const token = await authClient.getAccess(code);

        //res.Cookies.set('key', token);
        res.cookies.set('key', token)
        res.redirect('/dashboard');

    } catch (err) {

        console.log(err)

        console.log('inside auth error')
        res.render('errors/401');
    }
});

router.get('/auth-guild', async function (req, res) {

    try {

        console.log('in /auth-guild')

        const key = res.cookies.get('key');
        await sessions.update(key);
    } catch (err) {

        res.redirect('/dashboard');
    } finally {
        res.redirect('/dashboard');
    }
});

router.get('/logout', function (req, res) {

    console.log('deleting key and redirecting');

    res.cookies.set('key', '');

    res.redirect('/');
});

router.get('/invite', function (req, res) {


    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${MAIN.Client.user.id}&redirect_uri=${MAIN.REDIRECT_URL}/auth-guild&response_type=code&permissions=8&scope=bot`);

});


router.post('/formUpdate/createPlaylist', validateKey, async function (req, res) {

    console.log('in /formUpdate/createPlaylist')
    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });
    if (req.body.playlistTitle) {

        let playlist = res.locals.dbUser.playlists.find(element => element.title === req.body.playlistTitle);

        if (playlist) {
            res.status(400).json({
                message: 'Error message: You already have a playlist with this title!'
            }).end();
        }
        else {

            if ((req.body.playlistTitle.length == 0) || (req.body.playlistTitle.length > 200)) {
                res.status(400).json({
                    message: 'Error message: Invalid playlist title!'
                }).end();
            }
            else {

                res.locals.dbUser.playlists.push({ title: req.body.playlistTitle, songs: [] });
                User.findOneAndUpdate({ id: res.locals.dbUser.id }, { $set: { playlists: res.locals.dbUser.playlists } }).exec();
                res.status(200).json({
                    message: 'Successfully created new playlist!',
                    playlistTitle: req.body.playlistTitle
                })
            }

        }
    }
    else {
        res.status(400).json({
            message: 'Error message: Missing playlist title!'
        }).end();
    }
})

router.post('/formUpdate/addSong', validateKey, async function (req, res) {

    console.log('/formUpdate/addSong');


    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });

    if (req.body.playlistTitle) {

        let playlist = res.locals.dbUser.playlists.find(element => element.title === req.body.playlistTitle);

        if (playlist) {

            let URL = req.body.songURL;

            let spotiResult = await spotifyPlaylist(URL, null, null);

            if (spotiResult == -1) {

                res.status(400).json({
                    message: 'Error code: Could not find any matching songs on youtube to convert from Spotify'
                }).end();
                return;
            }
            else if (spotiResult == -10) {
                res.status(400).json({
                    message: 'Error code: Only single tracks are supported!'
                }).end();
                return;
            }
            else if (spotiResult.spoty) {

                URL = spotiResult.url;
            }


            console.log(`Trying to youtube check URL: ${URL}`)
            if (ytdl.validateURL(URL)) {
                songInfo = await ytdl.getInfo(URL);

                //console.log(songInfo)
                if (songInfo.videoDetails.lengthSeconds) {

                    if (!songInfo.player_response.microformat.playerMicroformatRenderer.availableCountries.includes('US')) {
                        res.status(400).json({
                            message: 'Error code: Song is region blocked!'
                        }).end();
                        return;
                    }

                    let startTime = URL.lastIndexOf('?t=');
                    let offset = 0;

                    if (startTime != -1) {

                        let tester = URL.substring(startTime + 3);
                        offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
                    }

                    let song = {
                        title: songInfo.videoDetails.title,
                        url: songInfo.videoDetails.video_url,
                        duration: songInfo.videoDetails.lengthSeconds,
                        start: null,
                        offset: offset,
                        id: songInfo.videoDetails.videoId,
                        paused: null,
                        timePaused: 0,
                        progress: 0
                    };

                    playlist.songs.push(song);
                    User.findOneAndUpdate({ id: res.locals.dbUser.id }, { $set: { playlists: res.locals.dbUser.playlists } }).exec();

                    res.status(200).json({
                        result: playlist,
                        message: 'Success!',
                        songTitle: song.title
                    }).end();
                }
            }
            else {
                res.status(400).json({
                    message: 'Error: Not a valid url: ' + req.body.songURL
                }).end();
            }
        }
        else {
            res.status(400).json({
                message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
            }).end();
        }
    }
    else {
        res.status(400).json({
            message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
        }).end();
    }
});


router.post('/formUpdate/playlistUpdate', validateKey, async function (req, res) {

    console.log('/formUpdate/playlistUpdate');

    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });

    if (req.body.playlistTitle) {

        let playlist = res.locals.dbUser.playlists.find(element => element.title === req.body.playlistTitle);

        if (playlist) {

            if (req.body.removeSongList)
                if (req.body.removeSongList.length > 0) {

                    for (let songToRemove of req.body.removeSongList) {

                        for (let i = 0; i < playlist.songs.length; i++) {

                            if (playlist.songs[i].title == songToRemove) {
                                playlist.songs.splice(i, 1);
                                break;
                            }
                        }
                    }
                }


            for (let i = 0; i < req.body.newSongList.length; i++) {

                let songTitle = req.body.newSongList[i];

                if (playlist.songs[i].title === songTitle) {

                }
                else {

                    let index;
                    let songItem;

                    for (let j = 0; j < playlist.songs.length; j++) {
                        if (playlist.songs[j].title === songTitle) {
                            index = j;
                            songItem = playlist.songs[j];
                            break;
                        }
                    }

                    playlist.songs[index] = playlist.songs[i];
                    playlist.songs[i] = songItem;
                }
            }

            User.findOneAndUpdate({ id: res.locals.dbUser.id }, { $set: { playlists: res.locals.dbUser.playlists } }).exec();

            res.status(200).json({
                result: playlist
            }).end();
        }
        else
            res.status(400).json({
                message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
            }).end();
    }
    else
        res.status(400).json({
            message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
        }).end();
});

router.post('/formUpdate/playlistDelete', validateKey, async function (req, res) {

    console.log('in deletePlaylist');
    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });

    if (req.body.playlistTitle) {

        let playlist = res.locals.dbUser.playlists.find(element => element.title === req.body.playlistTitle);

        let index = -1;

        for (let i = 0; i < res.locals.dbUser.playlists.length; i++) {

            if (res.locals.dbUser.playlists[i].title === req.body.playlistTitle) {
                index = i;
                break
            }
        }

        if (index != -1) {

            res.locals.dbUser.playlists.splice(index, 1);
            console.log(index);

            User.findOneAndUpdate({ id: res.locals.dbUser.id }, { $set: { playlists: res.locals.dbUser.playlists } }).exec();

            res.status(200).json({
                message: "Succesfuly deleted playlist."
            }).end();
        }
        else
            res.status(400).json({
                message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
            }).end();
    }
    else
        res.status(400).json({
            message: 'Error code: Could not find a personal playlist with the title: ' + req.body.playlistTitle
        }).end();
});

router.post('/formUpdate/userGames', validateKey, async function (req, res) {

    console.log('in /formUpdate/userGames');

    //console.log(req.body.commandSuggestions);

    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });

    if (req.body.excludePing === false)
        res.locals.dbUser.excludePing = false;
    else
        res.locals.dbUser.excludePing = true;

    if (req.body.excludeDM === false)
        res.locals.dbUser.excludeDM = false;
    else
        res.locals.dbUser.excludeDM = true;

    if (req.body.removeGamesList)
        for (let game of req.body.removeGamesList)
            if (res.locals.dbUser.games.includes(game))
                res.locals.dbUser.games.splice(res.locals.dbUser.games.indexOf(game), 1);


    User.findOneAndUpdate({ id: res.locals.dbUser.id }, {
        $set: {
            excludePing: res.locals.dbUser.excludePing,
            excludeDM: res.locals.dbUser.excludeDM,
            games: res.locals.dbUser.games
        }
    }).exec();

    res.status(200).json({
        newGamesList: res.locals.dbUser.games,
        message: "Succesfully updates personal game settings!"
    }).end();

    // MAIN.sendToBot({
    //     command: 'updateCache',
    //     params: [res.locals.dbUser.id]
    // });

    return 1;
});

router.post('/formUpdate/userQualityOfLife', validateKey, async function (req, res) {

    console.log('in /formUpdate/userQualityOfLife');

    //console.log(req.body.commandSuggestions);

    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });


    if (req.body.defaultPrefix)

        if ((req.body.defaultPrefix == '-1') || (req.body.defaultPrefix == 'sa!'))

            res.locals.dbUser.defaultPrefix = 'sa!';
        else if (req.body.defaultPrefix.length < 6)
            res.locals.dbUser.defaultPrefix = req.body.defaultPrefix;

    if (req.body.commandSuggestions === false)
        res.locals.dbUser.commandSuggestions = false;
    else
        res.locals.dbUser.commandSuggestions = true;

    User.findOneAndUpdate({ id: res.locals.dbUser.id }, {
        $set: {
            defaultPrefix: res.locals.dbUser.defaultPrefix,
            commandSuggestions: res.locals.dbUser.commandSuggestions
        }
    }).exec();

    res.status(200).json({
        message: "Successfully updated settings."
    }).end();

    MAIN.sendToBot({
        command: 'updateCache',
        params: [res.locals.dbUser.id]
    });

    return 1;
});

router.post('/formUpdate/serverQualityOfLife', validateKey, async function (req, res) {

    console.log('in /formUpdate/serverQualityOfLife');

    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id, guild: { id: req.body.serverID } }, true);
    let index = res.locals.dbUser.guilds.indexOf(req.body.serverID);

    if (index == -1) {
        res.status(400).json({
            message: 'Error code: Prefix Missing. Please notify the owner in the support server of this issue to get it fixed ASAP!'
        }).end();
    }

    let guild = MAIN.Client.guilds.cache.get(req.body.serverID);

    let isAdmin = guild.members.cache.get(res.locals.validatedUser.id).hasPermission("ADMINISTRATOR");

    let params = [res.locals.dbUser.id, guild.id];

    if ((req.body.userPrefix.length > 0) && (req.body.userPrefix.length < 6))
        if ((req.body.userPrefix == '-1') || (req.body.userPrefix == 'sa!'))
            res.locals.dbUser.prefix[index] = '-1';
        else
            res.locals.dbUser.prefix[index] = req.body.userPrefix;


    User.findOneAndUpdate({
        id: res.locals.validatedUser.id
    }, {
        $set: {
            prefix: res.locals.dbUser.prefix
        }
    }).exec();

    if (isAdmin)
        if ((req.body.serverPrefix.length > 0) && (req.body.serverPrefix.length < 6))
            if ((req.body.serverPrefix == '-1') || (req.body.serverPrefix == 'sa!'))
                Guild.findOneAndUpdate({
                    id: req.body.serverID
                }, {
                    $set: {
                        prefix: '-1'
                    }
                }).exec();
            else
                Guild.findOneAndUpdate({
                    id: req.body.serverID
                }, {
                    $set: {
                        prefix: req.body.serverPrefix
                    }
                }).exec();

    res.status(200).json({
        message: "Succesfuly updated user-server settings"
    }).end();


    MAIN.sendToBot({
        command: 'updateCache',
        params: params
    });

});

module.exports = router;






async function authoriseSpotify() {

    let basy = Buffer.from(CONFIG.spotifyClient + ':' + CONFIG.spotifySecret).toString('base64');

    let options = {
        headers: { 'Authorization': 'Basic ' + basy }
    };

    needle.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', options, function (err, resp) {
        if (err) console.log(err);
        if (resp) {
            Spotify.setAccessToken(resp.body.access_token);
        }
    })
}
authoriseSpotify();

async function spotifyPlaylist(message, params, user) {

    // if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    // let args = message.content.split(" ").slice(1).join(" ");
    let args = message;
    let id;
    let playlistTracks = { items: [] };
    if (args.includes('https://open.spotify.com/playlist/')) {

        return -10;//Only single tracks accepted for now

        // if (args.includes('?si='))
        //     id = args.substring(args.indexOf("/playlist/") + 10, args.indexOf('?si'));
        // else
        //     id = args.substring(args.indexOf("/playlist/") + 10);

        // try {
        //     playlistTracks = await Spotify.Tracks.getPlaylistTracks(id);
        // }
        // catch (err) {
        //     console.log("Not spotify!")
        //     return -1;
        // }
    }
    else if (args.includes('https://open.spotify.com/track/')) {

        if (args.includes('?si='))
            id = args.substring(args.indexOf("/track/") + 7, args.indexOf('?si'));
        else
            id = args.substring(args.indexOf("/track/") + 7);


        try {
            let tracky = await new Spotify.Track(id).getFullObject();
            playlistTracks.items.push(tracky);
        }
        catch (err) {
            console.log(err)
            console.log("Not spotify!")
            return -1;
        }
    }
    else {

        return -1;//Not spotify
    }


    // let notifMess = await message.channel.send("Parsing the spotify playlist...longer playlists may take a bit of time.");

    let found = [];
    let missed = [];
    let numFound = 0;
    let numSongs = 0;
    let steps = 0;
    let totalNumber = Object.keys(playlistTracks.items).length;

    let newOptions = {
        isCaseSensitive: false,
        findAllMatches: true,
        includeMatches: false,
        includeScore: true,
        useExtendedSearch: false,
        minMatchCharLength: 3,
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        keys: [
            "name"
        ]
    };






    let count = 1;

    console.log("over)", playlistTracks.items.length)
    let orderPlaylist = [playlistTracks.items[0]];



    // for (let trackID of playlistTracks.order) {
    //     orderPlaylist.push(playlistTracks.items[trackID])
    // }

    for (track of orderPlaylist) {

        console.log("COUNT: ", count);

        count++;
        //   console.log(track.artists)
        let artists = "";

        for (arty of track.artists) {
            artists += " " + arty.name;
        }

        let name = (artists + " " + track.name).trim();

        newOptions = {
            ...newOptions,
            minMatchCharLength: name.length / 3,
            findAllMatches: false,
            includeScore: true,
            isCaseSensitive: true,
            includeMatches: true,
            keys: ['title']
        }

        let searchResult = await ytsr(name, { limit: 5 });


        searchResult.items = searchResult.items.filter(element => element.type == 'video');
        console.log(searchResult.items.length)

        let searchyArray = searchResult.items.reduce((accum, current) => {
            current.title = current.title.replace(/([(){}&,\-])/g, '').replace(/\s{2,}/g, ' ');
            accum.push(current); return accum;
        }, []);

        let cleanedName = name.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ').toLowerCase();

        if (!cleanedName.includes("live")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("live"))
        }
        if (!cleanedName.includes("hour version")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("hour version"))
        }
        if (!cleanedName.includes("hours version")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("hours version"))
        }
        if (!cleanedName.includes("boosted")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("boosted"))
        }
        if (!cleanedName.includes("shorter")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("shorter"))
        }
        if (!cleanedName.includes("extended")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("extended"))
        }
        if (!cleanedName.includes("version")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("version"))
        }
        if (!cleanedName.includes("remix")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("remix"))
        }
        if (!cleanedName.includes("nightcore")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("nightcore"))
        }
        if (!cleanedName.includes("daycore")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("daycore"))
        }
        if (!cleanedName.includes("studio")) {
            searchyArray = searchyArray.filter(element => !element.title.toLowerCase().includes("studio"))
        }



        let fuse = new Fuse(searchyArray, newOptions);
        let result = fuse.search(name.replace(/([(){}&,\-])/g, '').replace(/\s{2,}/g, ' '));

        if (result.length == 0) {

            console.log(`entered empty length`)

            let FOUND = false;
            for (let result of searchyArray) {

                let counter = 0;

                let cleanedTitle = (result.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ').toLowerCase());
                cleanedName = cleanedName.replace('’', "'").replace(/\s{2,}/g, ' ');


                for (let word of cleanedName.split(" ")) {

                    if (cleanedTitle.includes(word))
                        counter++;
                }
                if ((counter / cleanedName.split(" ").length) > 0.65) {

                    return { url: result.link, spoty: true };
                    await play(message, { custom: true, url: result.link, spoti: true }, user);
                    numFound++;
                    FOUND = true;
                    continue;
                }

                if (FOUND) {
                    console.log("FOUND BREAK")
                    break;
                }
            }



            if (FOUND) {

                continue;
            }
            else {//name + fuzzy

                let searchResult = await ytsr(track.name, { limit: 5 });
                searchyResult = searchResult.items.filter(element => element.type == 'video');

                let fuse = new Fuse(searchResult.items, newOptions);
                let result = fuse.search(track.name);


                if (result.length == 0) {
                    missed.push({ original: track.name, found: "N/A", score: 'N/A', url: 'N/A' });
                    continue;
                }
                else if ((result[0].score <= 0.2) && (result.length > 0)) {
                    let topScores = result.filter(element => element.score <= 0.2);
                    topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                    return { url: topScores[0].item.url, spoty: true };
                    // await play(message, { custom: true, url: topScores[0].item.url, spoti: true }, user);
                    // found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                    //               console.log("name + fuzzy")
                }
                else {

                    let counter = 0;
                    let cleanedName = track.name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ');
                    let cleanedTitle = result[0].item.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ');
                    for (word of cleanedName.split(" ")) {

                        if (cleanedTitle.includes(word))
                            counter++;
                    }

                    if ((counter / cleanedName.split(" ").length) > 0.8) {
                        return { url: result[0].item.url, spoty: true };
                        // await play(message, { custom: true, url: result[0].item.url, spoti: true }, user);
                        // found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                        // console.log("name word match")
                        // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                    }
                    else {

                        let searchResult = await ytsr(track.artists[0].name + track.name, { limit: 5 });
                        searchyResult = searchResult.items.filter(element => element.type == 'video');

                        let fuse = new Fuse(searchResult.items, newOptions);
                        let result = fuse.search(track.name);

                        if ((result[0].score <= 0.2) && (result.length > 0)) {
                            let topScores = result.filter(element => element.score <= 0.2);
                            topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                            return { url: topScores[0].item.url, spoty: true };
                            // await play(message, { custom: true, url: topScores[0].item.url, spoti: true }, user);
                            // found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            //               console.log("name + fuzzy")
                        }
                        else {

                            let counter = 0;
                            let cleanedName = track.artists[0].name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ') + track.name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ');
                            let cleanedTitle = result[0].item.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ');
                            for (word of cleanedName.split(" ")) {

                                if (cleanedTitle.includes(word))
                                    counter++;
                            }

                            if ((counter / cleanedName.split(" ").length) > 0.8) {
                                return { url: result[0].item.url, spoty: true };
                                // await play(message, { custom: true, url: result[0].item.url, spoti: true }, user);
                                // found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                                // console.log("name word match")
                                // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            }
                            else {
                                missed.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            }
                        }
                    }

                }
            }
        }


        // console.log(result[0])
        // console.log('wwwwww')

        else if (result[0].score <= 0.2) {//artist + name fuzzy
            let topScores = result.filter(element => element.score <= 0.2);
            topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
            return { url: topScores[0].item.url, spoty: true };
            // await play(message, { custom: true, url: topScores[0].item.url, spoti: true }, user);
            // numFound++;
            //console.log("artist + name fuzzy")

        }
        else {//artist + name wordy match

            let counter = 0;
            let cleanedTitle = (result[0].item.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ').toLowerCase());
            cleanedName = cleanedName.replace('’', "'").replace(/\s{2,}/g, ' ');
            for (word of cleanedName.split(" ")) {

                if (cleanedTitle.includes(word))
                    counter++;
            }

            if ((counter / cleanedName.split(" ").length) > 0.65) {
                return { url: result[0].item.url, spoty: true };
                // await play(message, { custom: true, url: result[0].item.url, spoti: true }, user);
                // numFound++;
            }
            else {//name + fuzzy

                let searchResult = await ytsr(track.name, { limit: 5 });
                searchyResult = searchResult.items.filter(element => element.type == 'video');

                let fuse = new Fuse(searchResult.items, newOptions);
                let result = fuse.search(track.name);


                if (result.length == 0) {
                    missed.push({ original: track.name, found: "N/A", score: 'N/A', url: 'N/A' });
                    continue;
                }
                else if ((result[0].score <= 0.2) && (result.length > 0)) {
                    let topScores = result.filter(element => element.score <= 0.2);
                    topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                    return { url: topScores[0].item.url, spoty: true };
                    // await play(message, { custom: true, url: topScores[0]item.url, spoti: true }, user);
                    // found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0]item.url });
                    //               console.log("name + fuzzy")
                }
                else {

                    let counter = 0;
                    let cleanedName = track.name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ');
                    let cleanedTitle = result[0].item.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ');
                    for (word of cleanedName.split(" ")) {

                        if (cleanedTitle.includes(word))
                            counter++;
                    }

                    if ((counter / cleanedName.split(" ").length) > 0.8) {
                        return { url: result[0].item.url, spoty: true };
                        // await play(message, { custom: true, url: result[0]item.url, spoti: true }, user);
                        // found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                        // console.log("name word match")
                        // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                    }
                    else {
                        let searchResult = await ytsr(track.artists[0].name + track.name, { limit: 5 });
                        searchyResult = searchResult.items.filter(element => element.type == 'video');

                        let fuse = new Fuse(searchResult.items, newOptions);
                        let result = fuse.search(track.name);

                        if ((result[0].score <= 0.2) && (result.length > 0)) {
                            let topScores = result.filter(element => element.score <= 0.2);
                            topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                            return { url: topScores[0].item.url, spoty: true };
                            // await play(message, { custom: true, url: topScores[0].item.url, spoti: true }, user);
                            // found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            //               console.log("name + fuzzy")
                        }
                        else {

                            let counter = 0;
                            let cleanedName = track.artists[0].name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ') + track.name.replace(/([(){}&\-])/g, '').replace('’', "'").replace(/\s{2,}/g, ' ');
                            let cleanedTitle = result[0].item.title.replace(/([(){}&\-])/g, '').replace(/\s{2,}/g, ' ');
                            for (word of cleanedName.split(" ")) {

                                if (cleanedTitle.includes(word))
                                    counter++;
                            }

                            if ((counter / cleanedName.split(" ").length) > 0.8) {
                                return { url: result[0].item.url, spoty: true };
                                // await play(message, { custom: true, url: result[0].item.url, spoti: true }, user);
                                // found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                                // console.log("name word match")
                                // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            }
                            else {
                                missed.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.url });
                            }
                        }
                    }
                }
            }
        }


        numSongs++;

        // if ((numSongs / totalNumber) > (steps * 0.05)) {
        //     steps++;
        //     notifMess.edit(`Parsing the spotify playlist...the playlist is loaded in the background while the first songs play!`
        //         + "```md\n<" + `${Math.floor((numSongs / totalNumber) * 100)}% Complete!>` + "```");
        // }
    }

    return -404;//Could not find a match

    let finalReport = [];

    if (missed.length > 0)
        finalReport = finalReport.concat(missed.reduce(
            (accum, current, index) => {
                accum.push({ name: "Not Found Song(s)", value: `${index + 1}) ` + current.original + '\n' });
                return accum;
            }, []));

    if (found.length > 0)
        finalReport = finalReport.concat(found.reduce(
            (accum, current, index) => {
                accum.push({ name: "Probably correct song(s)", value: `${index + 1}) ` + current.original + '\n' });
                return accum;
            }, []));

    numSongs = orderPlaylist.length;

    if (finalReport.length > 0)
        MAIN.prettyEmbed(message, finalReport, {
            description: `I found ${numFound}/${numSongs} song for sure.\n${found.length}/${numSongs} I wasn't sure about **but should be accurate**.\n${missed.length} songs had no matches.`
                + "```fix\nUse the currentPlaylist command to view the whole **loaded** playlist!```", modifier: 1
        });
    // MAIN.prettyEmbed(message,
    //     `I found ${numFound}/${numSongs} song for sure.\n${found.length}/${numSongs} I wasn't sure about **but should be accurate**.\n${missed.length} songs had no matches.`
    //     + "```fix\nUse the currentPlaylist command to view the whole **loaded** playlist!```",
    //     finalReport, -1, -1, 1);

    //  notifMess.delete();
}