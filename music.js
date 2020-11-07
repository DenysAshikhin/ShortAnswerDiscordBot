const MAIN = require('./short-answer.js');
const path = require('path');
let ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const readline = require('readline');
var mv = require('mv');
const User = require('./User.js');
const fs = require('fs');
const Fuse = require('fuse.js');
const fsPromises = fs.promises;

var Spotify = require('enhanced-spotify-api');
var queue = new Map();
var download = new Map();
var cachedSongs = new Map();
var downloadingSongs = new Map();
var downloadManager = {
    limit: 5,
    active: [],
    backlog: []
};
var activeSkips = new Map();
var lastSkip = new Map();
var needle = require('needle');


const COOKIE = MAIN.config.youtubeCookie;
const TOKEN = MAIN.config.youtubeID;

async function authoriseSpotify() {

    await new Promise(resolve => setTimeout(resolve, 3000));

    let basy = Buffer.from(MAIN.spotifyClient + ':' + MAIN.spotifySecret).toString('base64');

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

async function loadCachedSongsMap() {

    let audioOutput = path.resolve(`songs`, `finished`);
    fs.readdir(audioOutput, (err, files) => {
        files.forEach(file => {
            cachedSongs.set(file.replace('.mp3', ''), true);
        });
    });
}
loadCachedSongsMap();

async function spotifyPlaylist(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    let args = message.content.split(" ").slice(1).join(" ");
    let id;
    let playlistTracks = { items: [] };
    if (args.includes('https://open.spotify.com/playlist/')) {

        if (args.includes('?si='))
            id = args.substring(args.indexOf("/playlist/") + 10, args.indexOf('?si'));
        else
            id = args.substring(args.indexOf("/playlist/") + 10);

        try {
            playlistTracks = await Spotify.Tracks.getPlaylistTracks(id);
        }
        catch (err) {
            console.log("Not spotify!")
            return -1;
        }
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
            console.log("Not spotify!")
            return -1;
        }
    }
    else {

        console.log("maybe just an id?");
        return -1;
    }


    let notifMess = await message.channel.send("Parsing the spotify playlist...longer playlists may take a bit of time.");

    let found = [];
    let missed = [];
    let numFound = 0;
    let numSongs = 0;
    let steps = 0;
    let totalNumber = Object.keys(playlistTracks.items).length;

    let newOptions;


    try {
        newOptions = JSON.parse(JSON.stringify(MAIN.options));
    }
    catch (err) {
        newOptions = JSON.parse(JSON.stringify(MAIN.options));
    }



    let count = 1;

    console.log("over)", playlistTracks.items.length)
    let orderPlaylist = [];
    for (let trackID of playlistTracks.order) {
        orderPlaylist.push(playlistTracks.items[trackID])
    }

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


        console.log(name);
        console.log(1)
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
                    await play(message, { custom: true, url: topScores[0].item.link, spoti: true }, user);
                    found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
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
                        await play(message, { custom: true, url: result[0].item.link, spoti: true }, user);
                        found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                        // console.log("name word match")
                        // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                    }
                    else {

                        let searchResult = await ytsr(track.artists[0].name + track.name, { limit: 5 });
                        searchyResult = searchResult.items.filter(element => element.type == 'video');

                        let fuse = new Fuse(searchResult.items, newOptions);
                        let result = fuse.search(track.name);

                        if ((result[0].score <= 0.2) && (result.length > 0)) {
                            let topScores = result.filter(element => element.score <= 0.2);
                            topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                            await play(message, { custom: true, url: topScores[0].item.link, spoti: true }, user);
                            found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
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
                                await play(message, { custom: true, url: result[0].item.link, spoti: true }, user);
                                found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                                // console.log("name word match")
                                // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                            }
                            else {
                                missed.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
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
            await play(message, { custom: true, url: topScores[0].item.link, spoti: true }, user);
            numFound++;
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
                await play(message, { custom: true, url: result[0].item.link, spoti: true }, user);
                numFound++;
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
                    await play(message, { custom: true, url: topScores[0].item.link, spoti: true }, user);
                    found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
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
                        await play(message, { custom: true, url: result[0].item.link, spoti: true }, user);
                        found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                        // console.log("name word match")
                        // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                    }
                    else {
                        let searchResult = await ytsr(track.artists[0].name + track.name, { limit: 5 });
                        searchyResult = searchResult.items.filter(element => element.type == 'video');

                        let fuse = new Fuse(searchResult.items, newOptions);
                        let result = fuse.search(track.name);

                        if ((result[0].score <= 0.2) && (result.length > 0)) {
                            let topScores = result.filter(element => element.score <= 0.2);
                            topScores.sort(function (a, b) { return a.item.title.length - b.item.title.length; });
                            await play(message, { custom: true, url: topScores[0].item.link, spoti: true }, user);
                            found.push({ original: name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
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
                                await play(message, { custom: true, url: result[0].item.link, spoti: true }, user);
                                found.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                                // console.log("name word match")
                                // console.log({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                            }
                            else {
                                missed.push({ original: track.name, found: result[0].item.title, score: result[0].score, url: result[0].item.link });
                            }
                        }
                    }
                }
            }
        }


        numSongs++;

        if ((numSongs / totalNumber) > (steps * 0.05)) {
            steps++;
            notifMess.edit(`Parsing the spotify playlist...the playlist is loaded in the background while the first songs play!`
                + "```md\n<" + `${Math.floor((numSongs / totalNumber) * 100)}% Complete!>` + "```");
        }
    }



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

    notifMess.delete();
}

async function volume(message, params, user, emoji) {

    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    const args = emoji ? emoji : Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (args < 0) return message.channel.send("The volume cannot be set to 0!");
    if (args > 100) return message.channel.send("The max volume is 100!");

    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {

        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)

        guildQueue.dispatcher.setVolumeLogarithmic(args / 100);
    }
}
exports.volume = volume;

async function pause(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        let song = guildQueue.songs[guildQueue.index];
        if (!song.paused) {
            song.paused = new Date();
        }
        guildQueue.dispatcher.pause();
    }

}
exports.pause = pause;

async function resume(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;



    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        let song = guildQueue.songs[guildQueue.index];
        if (song.paused) {

            song.timePaused = (new Date() - song.paused) / 1000 + song.timePaused;
            song.paused = null;
        }
        queue.get(message.guild.id).dispatcher.resume();
    }
}
exports.resume = resume;

async function skip(message, params, user, emoji) {

    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");


    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    let skipy = lastSkip.get(message.guild.id);
    const args = emoji ? 1 : Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (isNaN(args)) { MAIN.selfDestructMessage(message, "You have entered an invalid number!", 3, emoji); return -1; }
    if (Number(params) == 0) { MAIN.selfDestructMessage(message, "0 is not a valid number!", 3, emoji); return -1; }

    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        if (!skipy) lastSkip.set(message.guild.id, new Date());
        if (((new Date()) - skipy) <= 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        lastSkip.set(message.guild.id, new Date());

        if ((args == 0) && (guildQueue.index != (guildQueue.songs.length - 1)))
            guildQueue.index++;
        else if (args == 0) {
            MAIN.selfDestructMessage(message, `You're trying to skip too many songs!`, 3, emoji)
            return -1;
        }
        else if ((guildQueue.index + args) >= guildQueue.songs.length || (guildQueue.index + args) < 0) {
            MAIN.selfDestructMessage(message, `You're trying to skip too many songs!`, 3, emoji)
            return -1;
        }
        else { guildQueue.index += args; }

        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        resetSong(guildQueue.songs[guildQueue.index]);
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}
exports.skip = skip;

async function reverse(message, params, user, emoji) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    const args = emoji ? 1 : Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (isNaN(args)) { MAIN.selfDestructMessage(message, "You have entered an invalid number!", 3, emoji); return -1; }
    if (Number(params) == 0) { MAIN.selfDestructMessage(message, "0 is not a valid number!", 3, emoji); return -1; }

    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        if ((args == 0) && (guildQueue.index != 0))
            guildQueue.index--;
        else if (args == 0) {
            MAIN.selfDestructMessage(message, `You can't reverse 0 songs!`, 3, emoji);
            return -1;
        }
        else if ((guildQueue.index - args) >= guildQueue.songs.length || (guildQueue.index - args) < 0) {

            MAIN.selfDestructMessage(message, `You're trying to reverse too many songs!`, 3, emoji);
            return -1;
        }
        else { guildQueue.index -= args; }

        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        resetSong(guildQueue.songs[guildQueue.index]);
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}
exports.reverse = reverse;

async function stop(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let temp = queue.get(message.guild.id);

    if (temp) {
        //queue.get(message.guild.id).dispatcher.destroy();
        if (user.id != -1)
            if (!temp.connection.channel.members.get(user.id))
                return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        temp.collector.stop();
        await temp.voiceChannel.leave();
        queue.delete(message.guild.id);
        console.log("Music bot has left");
        // download.delete(message.guild.id);
    }
}
exports.stop = stop;

async function forward(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;
    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        let song = guildQueue.songs[guildQueue.index];

        if (Array.isArray(params)) params = params[0];
        if (isNaN(params))
            if (!/^[:0-9]+$/.test((params + '').substr(1))) return message.channel.send("You have entered an invalid forward format!");

        let newSkip = !isNaN(params) ? Number(params) : MAIN.hmsToSecondsOnly(params);
        let current = song.paused ? song.offset - song.timePaused + ((Math.floor(new Date() - song.start - ((new Date() - song.paused)))) / 1000)
            : song.offset - song.timePaused + ((Math.floor(new Date() - song.start)) / 1000);

        if (newSkip + current > song.duration || newSkip + current < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {

            if (song.start)
                if (!song.paused)
                    song.offset = ((new Date() - song.start) / 1000) + song.offset - song.timePaused + newSkip;
                else
                    song.offset = (((new Date() - song.start) - (new Date() - song.paused)) / 1000) + song.offset - song.timePaused + newSkip;
            else
                song.timePaused = 0;

            song.paused = null;
            song.start = null;

            let skipMessage = await message.channel.send(`Skipping to ${MAIN.timeConvert(Math.floor(song.offset))}`)//convert this to a time stamp later
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, skipMessage);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}
exports.forward = forward;

async function rewind(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    let song = guildQueue.songs[guildQueue.index];

    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        if (Array.isArray(params)) params = params[0];
        params = params.trim();
        if (!/^[:0-9]+$/.test(params)) return message.channel.send("You have entered an invalid rewind format!");

        let newSkip = !isNaN(params) ? Number(params) : MAIN.hmsToSecondsOnly(params);
        let current = song.paused ? song.offset - song.timePaused + ((Math.floor(new Date() - song.start - ((new Date() - song.paused)))) / 1000)
            : song.offset - song.timePaused + ((Math.floor(new Date() - song.start)) / 1000);

        if (current - newSkip > song.duration || current - newSkip < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {
            if (song.start)
                if (!song.paused)
                    song.offset = ((new Date() - song.start) / 1000) + song.offset - song.timePaused - newSkip;
                else
                    song.offset = (((new Date() - song.start) - (new Date() - song.paused)) / 1000) + song.offset - song.timePaused - newSkip;

            song.timePaused = 0;
            song.paused = null;
            song.start = null;
            let skipMessage = await message.channel.send(`Skipping to ${MAIN.timeConvert(Math.floor(song.offset))}`)//convert this to a time stamp later
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, skipMessage);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}
exports.rewind = rewind;

async function seek(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);


    if (guildQueue) {
        if (!guildQueue.connection.channel.members.get(user.id))
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        let song = guildQueue.songs[guildQueue.index];
        if (Array.isArray(params)) params = params[0];
        if (!/^[:0-9]+$/.test(params)) return message.channel.send("You have entered an invalid seek format!");
        let newSkip = isNaN(params) ? MAIN.hmsToSecondsOnly(params) : Number(params);

        if (newSkip > song.duration || newSkip < 0) return message.channel.send("You can't go beyond the song's duration!")
        else {
            song.offset = newSkip;
            song.timePaused = 0;
            song.paused = null;
            song.start = null;
            let skipMessage = await message.channel.send(`Skipping to ${MAIN.timeConvert(Math.floor(song.offset))}`)
            activeSkips.set(song.id, true);
            playSong(message.guild, song, newSkip, message);
            setTimeout(skippingNotification, 1000, skipMessage, song.id, 1);
        }
    }
}
exports.seek = seek;

//ask how to handle the location of new song
async function shuffle(message, params, user, emoji) {

    if (message.channel.type == 'dm') return message.reply("This command must be called from a server text channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing before seeing the shuffling!");

    MAIN.shuffleArray(guildQueue.songs);
    guildQueue.index = 0;
    playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    MAIN.selfDestructMessage(message, "The playlist has been shuffled!", 3, emoji);
}
exports.shuffle = shuffle;

async function goTo(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing!");
    if (!guildQueue.connection.channel.members.get(user.id))
        return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
    const args = Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (!args || isNaN(args)) return message.channel.send("You have to provide the number of the song to go to!");

    if ((guildQueue.songs.length < args) || (args <= 0)) return message.channel.send("You must enter a valid song number!");

    guildQueue.index = args - 1;

    if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];

    resetSong(guildQueue.songs[guildQueue.index]);
    playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    return message.channel.send(`Skipping to song #${args}!`);
}
exports.goTo = goTo;

async function repeat(message, params, user, emoji) {

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    let guildQueue = queue.get(message.guild.id);

    if (!guildQueue.connection.channel.members.get(user.id))
        return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)

    if (emoji) {
        if (emoji == -1)
            guildQueue.repeat = null;
        else
            guildQueue.repeat = emoji;
    }
    else if (!params.mode) {
        if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

        let guildQueue = queue.get(message.guild.id);
        if (!guildQueue) return message.channel.send("There needs to be a song playing!");

        const args = emoji ? emoji : message.content.split(" ").slice(1).join(" ");
        if (!args || !isNaN(args)) return message.channel.send("You have to provide a valid repeat mode!");

        MAIN.generalMatcher(message, args, user, ["One", "All", "Off"], [{ mode: "One" }, { mode: "All" }, { mode: "Off" }], repeat, "Enter the number associted with repeat mode you want.");
    }
    else if (!emoji) {

        if (params.mode.localeCompare("One") == 0)
            guildQueue.repeat = 1;
        else if (params.mode.localeCompare("All") == 0)
            guildQueue.repeat = 100;
        else
            guildQueue.repeat = null;
        message.channel.send(`Repeat mode set to ${params.mode}`);
    }
    return 111;
}
exports.repeat = repeat;

async function currentSong(message, params, user, emoji) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing before seeing the progress!");
    let song = guildQueue.songs[guildQueue.index];

    if (isNaN(song.timePaused)) song.timePaused = 0;
    let current = song.paused ? song.offset - song.timePaused + ((Math.floor(new Date() - song.start - ((new Date() - song.paused)))) / 1000)
        : song.offset - song.timePaused + ((Math.floor(new Date() - song.start)) / 1000);
    if (!emoji)
        message.channel.send("```md\n#" + song.title + "\n[" + MAIN.timeConvert(current) + "](" + MAIN.timeConvert(Math.floor(song.duration)) + ")```");
    return Math.floor(current);
}
exports.currentSong = currentSong;

function resetSong(song) {

    song.paused = null;
    song.timePaused = 0;
    song.start = null;
    song.offset = 0;
    song.progress = 0;
    if (activeSkips.get(song.id)) activeSkips.delete(song.id);
}
exports.resetSong = resetSong;

/*
params = {
    custom = true/false,
    url: "Asdasdas"
}
*/
async function play(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a server voice channel and send the command from a server!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    if (!params) return message.reply("You need to provide a song to play!");
    let serverQueue = queue.get(message.guild.id);

    if (serverQueue)
        if (serverQueue.connection)
            if (serverQueue.connectionchannel)
                if (!serverQueue.connection.channel.members.get(user.id))
                    return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)

    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send("You have to provide a link or title of song to play!");

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const memberPermissions = voiceChannel.permissionsFor(message.author);
    if (!memberPermissions.has('CONNECT') || !memberPermissions.has("SPEAK")) {
        return message.channel.send("You need permission to join and speak in your voice channel!");
    }

    let callPlay = false;
    let queueConstruct;

    if (!serverQueue) {
        queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            index: 0,
            volume: 3,
            playing: true,
            dispatcher: null,
            repeat: -1,
            originMessage: message
        };
        queue.set(message.guild.id, queueConstruct);
        serverQueue = queueConstruct;

    } else {

        queueConstruct = serverQueue;
    }

    let songInfo;

    let playlistID;

    try {
        playlistID = await ytpl.getPlaylistID(args);
    }
    catch (err) {
        console.log('not a playlist')
    }

    if (!params.spoti && ((await spotifyPlaylist(message, args, user)) != -1)) {
        console.log('it was spotify')

        console.log(params.spoti)
        console.log("args: ", args)
        console.log(params);
        //  console.log((await spotifyPlaylist(message, args, user)));
    }
    else if (ytdl.validateURL(args)) {
        songInfo = await ytdl.getInfo(args, {
            requestOptions: {
                headers: {
                    cookie: COOKIE,
                    'x-youtube-identity-token': TOKEN
                    // Optional. If not given, ytdl-core will try to find it.
                    // You can find this by going to a video's watch page, viewing the source,
                    // and searching for "ID_TOKEN".
                    // 'x-youtube-identity-token': 1324,
                },
            },
            quality: 'highestaudio'
        });

        //console.log(songInfo)
        if (songInfo.videoDetails.lengthSeconds) {

            if (!songInfo.player_response.microformat.playerMicroformatRenderer.availableCountries.includes('US'))
                return message.channel.send("This video is not available here! Please try another one.");

            let startTime = args.lastIndexOf('?t=');
            let offset = 0;

            if (startTime != -1) {

                let tester = args.substring(startTime + 3);
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
            queueConstruct.songs.push(song);
            await cacheSong(song, message.guild.id);


            if ((queueConstruct.songs.length > 1))
                if (!params.spoti) { await message.channel.send(`${songInfo.videoDetails.title} has been added to the queue!`); }
                else { }
            else {

                callPlay = true;
            }

        }
        else
            message.channel.send("I can't access that video, please try another!");
    }
    else if (playlistID && !params.spoti) {

        console.log('it was playlist')

        let playlist = '';

        try {
            playlist = await ytpl(args, { limit: 10000 })
                .catch(err => console.log(err))
        }
        catch (err) {
            message.channel.send("This playlist is private!");
            queue.delete(message.guild.id);
            return -1;
        }


        if ((queueConstruct.songs.length > 1))
            if (!params.spoti) { await message.channel.send(`${playlist.items.length} songs have been added to the queue!`); }
            else { }
        else {

            callPlay = true;
        }


        for (Video of playlist.items) {
            if (Video.duration) {

                let video = JSON.parse(JSON.stringify(Video))
                let song = {
                    title: video.title,
                    url: video.url_simple,
                    duration: MAIN.hmsToSecondsOnly(video.duration),
                    start: null,
                    offset: 0,
                    id: video.id,
                    paused: null,
                    timePaused: 0,
                    progress: 0
                }

                queueConstruct.songs.push(song);
                await cacheSong(song, message.guild.id);
            }
        }

        // MAIN.selfDestructMessage(message, `${playlist.items.length} songs have been added to the queue!`, 3, false);
    }
    else {
        let searchResult = await ytsr(args, { limit: 10 });

        let titleArray = [];
        let urlArray = [];

        for (let i = 0; i < searchResult.items.length; i++) {

            if (searchResult.items[i])
                if (searchResult.items[i].type == 'video') {
                    titleArray.push(searchResult.items[i].title);
                    urlArray.push({ url: searchResult.items[i].link, custom: true });
                }

            if (titleArray.length == 5)
                break;
        }

        if (searchResult.items.length == 0) {
            return message.channel.send("I did not find any matches for **" + args + "**");
        }


        return MAIN.generalMatcher(message, -23, user, titleArray, urlArray, play, "Please enter the number matching the video you wish to play!");
    }

    if (callPlay) {
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0], null, message);
        } catch (err) {

            MAIN.fs.promises.writeFile(`logs/${MAIN.uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
            queue.delete(message.guild.id)
            return message.channel.send("There was an error playing! " + err);
        }
    }
}
exports.play = play;

async function nextSong(serverQueue, guild, message) {

    if (serverQueue.repeat == 1) {
        resetSong(serverQueue.songs[serverQueue.index]);
        return (playSong(guild, serverQueue.songs[serverQueue.index]));
    }

    serverQueue.index++;

    if (serverQueue.index == serverQueue.songs.length)
        if (serverQueue.repeat == 100)
            serverQueue.index = 0;
        else
            serverQueue.songs = [];

    if (serverQueue.songs[serverQueue.index]) resetSong(serverQueue.songs[serverQueue.index]);
    playSong(guild, serverQueue.songs[serverQueue.index], null, message);
}
exports.nextSong = nextSong;

async function songControlEmoji(message) {

    checkControlsEmoji(message);
    await message.react('⏮️')
    await message.react('⏯️')
    await message.react('⏭️')
    await message.react('🔉')
    await message.react('🔊')
    await message.react('⏹️')
    await message.react('🔀')
    await message.react('🔁')
    await message.react('↩️')
}

async function refreshEmojiControls() {
    for (let messy of queue.values()) {
        if (messy.collector) {
            messy.collector.resetTimer();
            try {
                messy.message.edit("```md\nNow Playing" + ` Song ${messy.index + 1}/${messy.songs.length}` + "\n#" + messy.songs[messy.index].title + "\n[" + MAIN.timeConvert(await currentSong(messy.message, null, null, true))
                    + "](" + MAIN.timeConvert(Math.floor(messy.songs[messy.index].duration)) + ")```");
            }
            catch (err) {
                console.log("Error in refresh Emoji controls in music");
                fs.promises.writeFile(`logs/${uniqid()}.json`, "Error in refresh Emoji controls in music" + JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
            }
        }
    }
}
setInterval(refreshEmojiControls, 5 * 1000);

async function checkControlsEmoji(message) {

    let collector = await message.createReactionCollector(function (reaction, user) {
        return (((reaction.emoji.name === '⏮️') || (reaction.emoji.name === '⏯️') ||
            (reaction.emoji.name === '⏭️') || (reaction.emoji.name === '🔊') || (reaction.emoji.name === '🔉')
            || (reaction.emoji.name === '⏹️') || (reaction.emoji.name === '🔀') || (reaction.emoji.name === '↩️')
            || (reaction.emoji.name === '🔁')) && (!user.bot))
    }, { time: 60000 });
    collector.on('collect', async function (emoji, user) {

        let exactQueue = queue.get(emoji.message.guild.id);

        if (!exactQueue.connection.channel.members.get(user.id)) {
            emoji.users.remove(user);
            return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)
        }
        // if (user.bot) {
        //     emoji.users.remove(user);
        //     return 111;
        // }
        if (emoji.emoji.toString() == '⏮️') {

            reverse(emoji.message, '1', user, emoji);
        }
        else if (emoji.emoji.toString() == '⏯️') {
            if (exactQueue.songs[exactQueue.index].paused) {
                resume(emoji.message, null, user);
            }
            else pause(emoji.message, null, user);
        }
        else if (emoji.emoji.toString() == '⏭️') {
            skip(emoji.message, '1', user, emoji);
        }
        else if (emoji.emoji.toString() == '🔊') {

            if (exactQueue.volume >= 4.5) {
                MAIN.selfDestructMessage(emoji.message, "The volume is already maxed!", 3, emoji);
            }
            else {
                exactQueue.volume += 0.5;
                MAIN.selfDestructMessage(emoji.message, "Increased volume by 5%", 3, emoji);
                volume(emoji.message, (exactQueue.volume * 20), user, (exactQueue.volume * 20))
            }

        }
        else if (emoji.emoji.toString() == '🔉') {
            if (exactQueue.volume <= 0.5) {
                MAIN.selfDestructMessage(emoji.message, "The volume is already minimum!", 3, emoji);
            }
            else {
                exactQueue.volume -= 0.5;
                MAIN.selfDestructMessage(emoji.message, "Decreased volume by 5%", 3, emoji);
                volume(emoji.message, '', user, (exactQueue.volume * 20))
            }
        }
        else if (emoji.emoji.toString() == '⏹️') {

            stop(emoji.message, null, user);
        }
        else if (emoji.emoji.toString() == '🔀') {

            shuffle(emoji.message, null, user, true);
        }
        else if (emoji.emoji.toString() == '🔁') {

            if (exactQueue.repeat == 1) {
                repeat(emoji.message, 100, user, 100);
                MAIN.selfDestructMessage(emoji.message, "Will repeat the entire playlist!", 3, true);
            }
            else if (exactQueue.repeat == 100) {
                repeat(emoji.message, -1, user, -1);
                MAIN.selfDestructMessage(emoji.message, "Repeat turned off!", 3, true);
            }
            else if (exactQueue.repeat == -1) {
                repeat(emoji.message, null, user, 1);
                MAIN.selfDestructMessage(emoji.message, "Will repeat the current song!", 3, true);
            }
        }
        else if (emoji.emoji.toString() == '↩️') {
            if (!(await checkMusicPerm(user, message.guild, message)))
                return -1;
            await exactQueue.message.delete();
            exactQueue.message = null;
            let newMessage = await emoji.message.channel.send("```md\nNow Playing\n#" + exactQueue.songs[exactQueue.index].title + "\n["
                + '00:00'
                + "](" + MAIN.timeConvert(Math.floor(exactQueue.songs[exactQueue.index].duration)) + ")```");
            exactQueue.message = newMessage;
            await songControlEmoji(newMessage);
        }
        if (!(emoji.emoji.toString() == '↩️'))
            emoji.users.remove(user);
    });

    let exactQueue = queue.get(message.guild.id);
    exactQueue.collector = collector;
}

async function playSong(guild, sonG, skip, message) {
    const serverQueue = queue.get(guild.id);


    if (serverQueue) {
        if (!serverQueue.message) {
            serverQueue.message = await message.channel.send("```md\nNow Playing" + ` Song ${serverQueue.index + 1}/${serverQueue.songs.length}` + "\n#" + sonG.title + "\n["
                + '00:00'
                + "](" + MAIN.timeConvert(Math.floor(sonG.duration)) + ")```");
            songControlEmoji(serverQueue.message)
        }
    }
    // else if (sonG) serverQueue.message.edit("```md\nNow Playing" + ` Song ${serverQueue.index + 1}/${serverQueue.songs.length}` + "\n#" + sonG.title + "\n["
    //     + '00:00'
    //     + "](" + MAIN.timeConvert(Math.floor(sonG.duration)) + ")```");

    let song = sonG;

    if (!song) {
        message.channel.send(`No more songs queued, leaving!`);
        stop(message, null, { id: -1 });
        return;
    }

    let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');
    let audioOutputExists = cachedSongs.get(song.id);

    if (!song.start && (song.offset > 0) && !audioOutputExists && !skip) {
        return forward(message, song.offset)
    }

    if (audioOutputExists) {

        const Dispatcher = await serverQueue.connection.play(audioOutput, { seek: song.offset })
            .on('error', error => {
                console.log("Error inside of dispatcher playing?: ");
            })
            .on('finish', () => {

                nextSong(serverQueue, guild, message);
            })
            .on('start', () => {

                if (!song.start)
                    song.start = new Date();
                if (song.paused) {

                    song.timePaused = (new Date() - song.paused) / 1000 + song.timePaused;
                    song.paused = null;
                }
                if (activeSkips.get(song.id)) activeSkips.delete(song.id);
            })


        Dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.dispatcher = Dispatcher;
    }
    else if (skip && (skip != -1)) {

        let percentageToDownload = 100 - download.get(guild.id).progress;
        let percentageToSkip = (song.offset / song.duration) * 100;


        if ((percentageToSkip > percentageToDownload) && (download.get(guild.id).songToDownload.id == song.id)) {
            console.log("chose to wait");

            return setTimeout(playSong, 1000, guild, song, skip, message);
        }
        else {
            return playSong(guild, song, -1, message)
        }
    }
    else {

        //Create a seperate read stream solely for buffering the audio so that it doesn't hold up the previous write stream

        let streamResolve = await ytdl(song.url, {
            requestOptions: {
                headers: {
                    cookie: COOKIE,
                    'x-youtube-identity-token': TOKEN
                    // Optional. If not given, ytdl-core will try to find it.
                    // You can find this by going to a video's watch page, viewing the source,
                    // and searching for "ID_TOKEN".
                    // 'x-youtube-identity-token': 1324,
                },
            },
            format: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25, requestOptions: { maxRedirects: 4 }
        });
        // streamResolve.on('info', (info) => { console.log(); console.log('yeeeee') })
        streamResolve.on('error', (err) => {
            console.log("RESOLVE ERROR")
            //message.channel.send(`${song.title} is no longer availabe, I suggest removing it with the removeSong command. Skipping it for now...`);
            skip(message, 1, null, true);
        })
        const Dispatcher = await serverQueue.connection.play(streamResolve, { seek: song.offset })
            .on('error', error => {
                console.log("inside of error   ");
                console.log(error)
            })
            .on('finish', () => {

                nextSong(serverQueue, guild, message);
            })
            .on('start', () => {

                if (!song.start)
                    song.start = new Date()
                if (song.paused) {

                    song.timePaused = (new Date() - song.paused) / 1000 + song.timePaused;
                    song.paused = null;
                }
                if (activeSkips.get(song.id)) activeSkips.delete(song.id);
            })

        Dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
        serverQueue.dispatcher = Dispatcher;
    }
}
exports.playSong = playSong;

//make a queue system for a max of 20 songs at a time.
/**
 * 
 * @param {id: link id, url: youtubelink} song 
 */
async function cacheSong(song, GUILD, MESSAGE) {

    console.log(`There are ${downloadManager.active.length + downloadManager.backlog.length} servers downloading songs! ${GUILD}`);

    let guild;
    let serverDownload;
    let message;
    if (!song)

        if (downloadManager.active.length == downloadManager.limit) return -1;
        else if ((downloadManager.backlog.length == 0)) return -1;
        else {
            guild = downloadManager.backlog.shift();
            downloadManager.active.push(guild);
            serverDownload = download.get(guild);
            if (!serverDownload) {
                downloadManager.active.splice(downloadManager.active.indexOf(guild), 1);
                return cacheSong(null, guild);
            }
            message = serverDownload.message;
        }
    else {
        if (cachedSongs.get(song.id)) {
            return 21; //Song is already cached
        }

        serverDownload = download.get(GUILD);
        if (!serverDownload) {
            download.set(GUILD,
                {
                    songToDownload: null,
                    progress: 0,
                    leftOver: [JSON.parse(JSON.stringify(song))],
                    message: MESSAGE
                }
            );
            serverDownload = download.get(GUILD);

            if (downloadManager.active.length == downloadManager.limit) {
                downloadManager.backlog.push(GUILD);
                serverDownload.leftOver.push(JSON.parse(JSON.stringify(song)));
                return -1;
            }
            else {
                guild = GUILD;
                downloadManager.active.push(guild);
                message = MESSAGE;
            }
        }
        else {
            serverDownload.leftOver.push(JSON.parse(JSON.stringify(song)));
            return -1;
        }
    }

    if (!serverDownload) {
        console.log("IT WAS MISSING")
        console.log(serverDownload)
        console.log(song)
        console.log(GUILD)
        console.log(guild)
    }

    if (serverDownload.leftOver.length == 0) {

        download.delete(guild);
        downloadManager.active.splice(downloadManager.active.indexOf(guild), 1);
        cacheSong(null, null);
        return 1;
    }


    serverDownload.songToDownload = serverDownload.leftOver.shift();//songToDownload also used for checking in skip ahead logic
    song = serverDownload.songToDownload;

    let tempAudio = path.resolve(`songs`, song.id + '.mp3');
    let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');

    let audioExists = cachedSongs.get(song.id);
    let tempAudioExists = downloadingSongs.get(song.id);

    if (!tempAudioExists && !audioExists) {

        try {
            let downloadYTDL = require('ytdl-core');
            downloadingSongs.set(song.id, true);

            /*
    player_response": {
        "playabilityStatus": {
          "status": "OK
            */
            let youtubeResolve = await downloadYTDL(song.url, {
                requestOptions: {
                    headers: {
                        cookie: COOKIE,
                        'x-youtube-identity-token': TOKEN
                        // Optional. If not given, ytdl-core will try to find it.
                        // You can find this by going to a video's watch page, viewing the source,
                        // and searching for "ID_TOKEN".
                        // 'x-youtube-identity-token': 1324,
                    },
                },
                filter: 'audioonly', highWaterMark: 1 << 25, requestOptions: { maxRedirects: 4 }
            });


            let writeStream = fs.createWriteStream(tempAudio);
            let currentSongsQueue = queue.get(guild);
            if (!currentSongsQueue) {
                serverDownload.songToDownload = null;
                serverDownload.progress = 0;
                downloadingSongs.delete(song.id);
                downloadManager.active.splice(downloadManager.active.indexOf(guild), 1);
                cacheSong(null, guild);
            }
            if (!currentSongsQueue) {

                serverDownload.songToDownload = null;
                serverDownload.progress = 0;
                downloadingSongs.delete(song.id);
                downloadManager.active.splice(downloadManager.active.indexOf(guild), 1);
                downloadManager.backlog.push(guild);
                cacheSong(null, guild);
            }
            currentSongsQueue.ytdl = youtubeResolve;
            currentSongsQueue.writeStream = writeStream;

            writeStream.on('finish', () => {
                //console.log("FINISHED: WRITE STREAM " + song.title);
                mv(tempAudio, audioOutput, function (err) {
                    if (err) {

                        MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
                    }
                    serverDownload.songToDownload = null;
                    serverDownload.progress = 0;
                    cachedSongs.set(song.id, true);
                    downloadingSongs.delete(song.id);
                    downloadManager.active.splice(downloadManager.active.indexOf(guild), 1);
                    downloadManager.backlog.push(guild);
                    cacheSong(null, guild);
                });
            });

            youtubeResolve.on('progress', (chunkLength, downloaded, total) => {

                if (!currentSongsQueue.songs[currentSongsQueue.index])
                    return 1;

                currentSongsQueue.songs[currentSongsQueue.index].totalSize = (total - 50000);
                const percent = downloaded / total;
                readline.cursorTo(process.stdout, 0);
                song.progress = Math.floor((percent * 100).toFixed(2));
                if (download.get(guild))
                    download.get(guild).progress = song.progress;
            });
            youtubeResolve.pipe(writeStream);
        }
        catch (err) {
            console.log(err)
            console.log("Caught error when caching (probably stopped stream before cached was done")
        }
    }
}
exports.cacheSong = cacheSong;

/**
 * 
 * step:
 * -1 - quit
 * 1) put the song in a provided playlist
 * 2) They chose a search result and a freaking playlist
 */
async function addSong(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *");

    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");


    if (!params.custom) {

        if (args.includes('https://open.spotify.com/track/')) {

            if (args.includes('?si='))
                id = args.substring(args.indexOf("/track/") + 7, args.indexOf('?si'));
            else
                id = args.substring(args.indexOf("/track/") + 7);


            try {
                let tracky = await new Spotify.Track(id).getFullObject();
                let artists = "";

                for (arty of tracky.artists) {
                    artists += " " + arty.name;
                }

                let name = (artists + " " + tracky.name).trim();

                message.content = message.content.split(" ")[0] + name;

                return (addSong(message, params, user));
            }
            catch (err) {
                console.log(err)
                console.log("Not spotify!")
                return -1;
            }
        }
    }


    if (!args) return message.channel.send("You have to provide a link or title of song to play!");

    let serverQueue = queue.get(message.guild.id);
    let song;

    if (!params.step)
        params = params.url && !params.step ? params.url : message.content.split(" ").slice(1).join(" ");

    if (!params.step) {

        if (!params && !serverQueue) return message.channel.send("There is no song currently playing"
            + " and you have not provided a url/search term. Make sure at least one of those exsit before adding a song!");
        else if (!params) {
            song = serverQueue.songs[serverQueue.index];
        }
        else if (ytdl.validateURL(params)) {
            songInfo = await ytdl.getInfo(params, {
                requestOptions: {
                    headers: {
                        cookie: COOKIE,
                        'x-youtube-identity-token': TOKEN
                        // Optional. If not given, ytdl-core will try to find it.
                        // You can find this by going to a video's watch page, viewing the source,
                        // and searching for "ID_TOKEN".
                        // 'x-youtube-identity-token': 1324,
                    },
                },
                quality: 'highestaudio'
            });

            if (songInfo.videoDetails.lengthSeconds) {
                //On version 3 its info.videoDetails.availableCountries
                if (!songInfo.player_response.microformat.playerMicroformatRenderer.availableCountries.includes('US'))
                    return message.channel.send("This video is not available here! Please try another one.");
                let startTime = params.lastIndexOf('?t=');
                let offset = 0;

                if (startTime != -1) {

                    let tester = params.substring(startTime + 3);
                    offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
                }

                song = {
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
            }
            else
                message.channel.send("I can't access that video, please try another!");
        }
        else {
            let searchResult = await ytsr(params, { limit: 10 });

            let titleArray = [];
            let urlArray = [];

            for (let i = 0; (i < searchResult.items.length) && (titleArray.length != 5); i++) {

                if (searchResult.items[i].type == 'video') {
                    titleArray.push(searchResult.items[i].title);
                    urlArray.push({ url: searchResult.items[i].link });
                }
            }
            return MAIN.generalMatcher(message, searchResult.query, user, titleArray, urlArray, addSong, "Please enter the number matching the song you wish to add!");
        }

        let titleArray = [];
        let internalArray = [];
        for (let i = 0; i < user.playlists.length; i++) {

            titleArray.push(user.playlists[i].title);
            internalArray.push({ step: 1, playlist: user.playlists[i], index: i, song: song });
        }
        return MAIN.generalMatcher(message, -23, user, titleArray, internalArray, addSong,
            "Enter the number associated with the playlist you wish to add the song to");
    }
    else {
        params.playlist.songs.push(params.song);
        user.playlists[params.index] = params.playlist;
        message.channel.send(`Succesfully added ${params.song.title} to ${params.playlist.title}`)
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
        return 1
    }
}
exports.addSong = addSong;

async function savePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *");

    let serverQueue = queue.get(message.guild.id);
    let song;

    if (!params.playlist)
        params = params.url && !params.step ? params.url : message.content.split(" ").slice(1).join(" ");

    if (!params.playlist) {

        if (!serverQueue) return message.channel.send("No songs are currently playing, start some before trying to add them to a playlist.");

        let titleArray = [];
        let internalArray = [];
        for (let i = 0; i < user.playlists.length; i++) {

            titleArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i], index: i, });
        }

        let query = params ? params : -23;
        return MAIN.generalMatcher(message, query, user, titleArray, internalArray, savePlayList,
            "Enter the number associated with the playlist you wish to add the song to. Or create a new playlist with the *createPlayList* command.");
    }
    else {

        for (song of serverQueue.songs) {
            params.playlist.songs.push(JSON.parse(JSON.stringify(song)));
        }

        user.playlists[params.index] = params.playlist;
        message.channel.send(`Succesfully added ${serverQueue.songs.length} songs to ${params.playlist.title}`)
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
        return 1;
    }
}
exports.savePlayList = savePlayList;

async function removeSong(message, params, user) {

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists!");

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");
    let playListEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    playListEmbed.timestamp = new Date();

    if (params.song) {

        params.playlist.songs.splice(params.index, 1);
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) {
            if (err) {
                MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
                return -1;
            }
            else {
                message.channel.send(`Succesfully removed ${params.song.title}`);
            }
        });
        return 100;
    }
    else if (params.playlist) {

        //if(params.playlist.songs.length == 0) return message.channel.send

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < params.playlist.songs.length; i++) {
            promptArray.push(params.playlist.songs[i].title);
            internalArray.push({ playlist: params.playlist, song: params.playlist.songs[i], index: i });
        }
        return MAIN.generalMatcher(message, -23, user, promptArray, internalArray, removeSong, `Enter the number of the song you wish to remove from ${params.playlist.title}`);

    } else {

        let playlists = [];
        let internalArray = [];
        for (playlist of user.playlists) {
            playlists.push(playlist.title);
            internalArray.push({ playlist: playlist });
        }
        let query = params ? params : -23;
        return MAIN.generalMatcher(message, query, user, playlists, internalArray, removeSong, `Enter the number of the playlist you wish to remove the song from!`);
    }
}
exports.removeSong = removeSong;

async function playUserPlayList(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    if (!(await checkMusicPerm(user, message.guild, message)))
        return -1;

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *");
    let serverQueue = queue.get(message.guild.id);

    if (serverQueue)
        if (serverQueue.connection)
            if (serverQueue.connection.channel)
                if (!serverQueue.connection.channel.members.get(user.id))
                    return MAIN.selfDestructMessage(message, "You must be in the same voice channel!", 3, true)

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) return message.reply("You must be in a voice channel!");
    const permission = voiceChannel.permissionsFor(message.client.user);
    if (!permission.has('CONNECT') || !permission.has("SPEAK")) {
        return message.channel.send("I need permission to join and speak in your voice channel!")
    }

    const memberPermissions = voiceChannel.permissionsFor(message.author);
    if (!memberPermissions.has('CONNECT') || !memberPermissions.has("SPEAK")) {
        return message.channel.send("You need permission to join and speak in your voice channel!");
    }

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");

    if (params.playlist) {
        let callPlay = false;
        let queueConstruct;

        if (!serverQueue) {
            queueConstruct = {
                textChannel: message.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                index: 0,
                volume: 3,
                playing: true,
                dispatcher: null,
                repeat: -1,
                originMessage: message
            };
            queue.set(message.guild.id, queueConstruct);
            serverQueue = queueConstruct;
            callPlay = true;
        } else
            queueConstruct = serverQueue;


        for (video of params.playlist.songs) {
            if (video.duration) {
                queueConstruct.songs.push({
                    ...video,
                    start: null,
                    offset: 0,
                    timePaused: 0,
                    progress: 0
                });
                await cacheSong({ id: video.id, url: video.url }, message.guild.id);
            }
        }
        MAIN.selfDestructMessage(message, `${params.playlist.songs.length} songs have been added to the queue!`, 3, false);

        if (callPlay) {
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                queueConstruct.songs[0].timePaused = 0;
                playSong(message.guild, queueConstruct.songs[0], null, message);
            } catch (err) {
                MAIN.fs.promises.writeFile(`logs/${uniqid()}.json`, JSON.stringify(err.message + "\n\n" + err.stack + "\n-------------\n\n"), 'UTF-8');
                queue.delete(message.guild.id)
                return message.channel.send("There was an error playing! " + err);
            }
        }
    }
    else {
        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i] });
        }
        let query = params ? params : -23;
        return MAIN.generalMatcher(message, query, user, promptArray, internalArray, playUserPlayList, `Enter the number of the playlist you wish to load the songs from!`)
    }
}
exports.playUserPlayList = playUserPlayList;

async function removePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *");

    params = params.playlist ? params : message.content.split(" ").slice(1).join(" ");

    if (params.playlist) {

        message.channel.send(`${params.playlist.title} has been deleted!`);
        user.playlists.splice(params.index, 1);
        User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
    }
    else {
        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push({ playlist: user.playlists[i], index: i });
        }
        let query = params ? params : -23;
        return MAIN.generalMatcher(message, query, user, promptArray, internalArray, removePlayList, `Enter the number of the playlist you wish to delete!`)
    }
}
exports.removePlayList = removePlayList;

async function myPlayLists(message, params, user) {

    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists!");

    params = params.title ? params : message.content.split(" ").slice(1).join(" ");

    let playListEmbed = JSON.parse(JSON.stringify(MAIN.Embed));
    playListEmbed.timestamp = new Date();

    if (!params) {

        let promptArray = [];
        let internalArray = [];

        for (let i = 0; i < user.playlists.length; i++) {

            promptArray.push(user.playlists[i].title);
            internalArray.push(user.playlists[i]);
        }
        return MAIN.generalMatcher(message, -23, user, promptArray, internalArray, myPlayLists, `Enter the number of the playlist you wish to view more information about!`)
    }
    else if (params.title) {

        if (params.songs.length == 0) return message.channel.send(`${params.title} does not have any songs!`);

        let fieldArray = new Array();
        for (song of params.songs)
            fieldArray.push(song.title + "\n");

        MAIN.prettyEmbed(message, fieldArray, { description: `Here are the songs for **${params.title}**`, startTally: 1, modifier: 1 });
        //MAIN.prettyEmbed(message, `Here are the songs for **${params.title}**`, fieldArray, -1, 1, 1);
    }
    else {

        let playlists = [];
        for (playlist of user.playlists)
            playlists.push(playlist.title);

        return MAIN.generalMatcher(message, params, user, playlists, user.playlists, myPlayLists, `Enter the number of the playlist you wish to view more information about!`);
    }
}
exports.myPlayLists = myPlayLists;

function createPlaylist(message, params, user) {
    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    //if (message.content.toLowerCase() == (prefix + "createplaylist")) return message.channel.send("You need to provide a name for the new playlist.")

    let newName = message.content.split(" ").slice(1).join(" ").trim();

    if (newName.length == 0) return message.channel.send("You can't have a blank for the playlist name!");

    if (user.playlists.some((value) => { return value.title == newName })) return message.channel.send(`You already have a playlist called ${newName}`);

    if (newName.length > 200) return message.channel.send(`${newName} is too loong!`);
    user.playlists.push({ title: newName, songs: [] })
    User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });

    message.channel.send(`${newName} has been created!`);
}
exports.createPlaylist = createPlaylist;

async function currentPlaylist(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");

    let songQueue = queue.get(message.guild.id);

    if (!songQueue) return message.channel.send(`There aren't any songs playing!`);
    if (!songQueue.songs) return message.channel.send(`There aren't any songs playing!`);

    let totalDuration = songQueue.songs.reduce((total, num) => { return total + Number(num.duration) }, 0);
    let fieldArray = new Array();

    for (let i = 0; i < songQueue.songs.length; i++) {
        let song = songQueue.songs[i];
        if (song == songQueue.songs[songQueue.index]) fieldArray.push(`#${i + 1}) ${song.title}\n`);
        else fieldArray.push(`${i + 1}) ${song.title}\n`);
    }

    MAIN.prettyEmbed(message, fieldArray, {
        description: `There are a total of ${songQueue.songs.length} songs queued. Total duration: ${MAIN.timeConvert(totalDuration)}`,
        modifier: 'md'
    });
    //MAIN.prettyEmbed(message, `There are a total of ${songQueue.songs.length} songs queued. Total duration: ${MAIN.timeConvert(totalDuration)}`,
    // fieldArray, -1, -1, 'md');
}
exports.currentPlaylist = currentPlaylist;

function skippingNotification(message, songID, step) {

    if (activeSkips.get(songID)) {

        if (step == 1) {
            message.edit(message.content + " :musical_note:");
            step = 2;
        }
        else {
            message.edit(message.content + " :notes:");
            step = 1;
        }

        setTimeout(skippingNotification, 3000, message, songID, step);

    }
    else {
        message.delete();
    }
}
exports.skippingNotification = skippingNotification;

async function removeLastModifiedSong() {

    const directory = path.join(__dirname, `songs`);
    let song;
    await fs.readdir(directory, async (err, files) => {
        if (err) throw err;

        for (const file of files) {
            if (file != "finished") {

                let stats = fs.statSync(path.join(directory, file));

                if (!song) song = { file: path.join(directory, file), time: stats.aTimeMs }

                if (stats.aTimeMs < song.time) song = { file: path.join(directory, file), time: stats.aTimeMs }

            }
        }
        if (song)
            fs.unlink(song.file, () => { });
    });
}

async function removeTempSongs() {
    const directory = path.join(__dirname, `songs`);
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {

            if (file != "finished") {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        }
    });
}
removeTempSongs();

async function checkEmptyChannel() {

    if (queue.size > 0) {
        for (server of queue.entries()) {
            if (!server[1].connection) {
                download.delete(server[1].originMessage.guild.id);
                queue.delete(server[0]);
                console.log("Music bot has left");
                continue;
            }
            if (server[1].connection.channel.members.size == 1) {
                if (server[1].originMessage.channel) {
                    server[1].originMessage.channel.send("Leaving because there is no one listening!");
                    await server[1].voiceChannel.leave();
                }
                download.delete(server[1].originMessage.guild.id);
                queue.delete(server[0]);
                console.log("Music bot has left");
            }
        }

        console.log(`There are ${queue.size} active music bots!`);
    }
}



const checkMusicPerm = async function (user, guild, message) {


    let guildDB = await MAIN.findGuild({ id: guild.id });

    if (!guildDB.musicRole)
        return true;

    let role = guild.roles.cache.get(guildDB.musicRole);
    let member = guild.members.cache.get(user.id);

    if (member.roles.highest.comparePositionTo(role) < 0) {
        message.channel.send("You don't have a high enough role to control the music functionalties!");
        return false;
    }

    return true;
}


setInterval(authoriseSpotify, 50 * 60 * 1000);
setInterval(checkEmptyChannel, 60 * 1000);