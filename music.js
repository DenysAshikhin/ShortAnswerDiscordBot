const MAIN = require('./short-answer.js');
const path = require('path');
let ytdl = require("ytdl-core");
const ytpl = require('ytpl');
const ytsr = require('ytsr');
const readline = require('readline');
var mv = require('mv');
const User = require('./User.js');
const config = require('./config.json');
const fs = require('fs');
const fsPromises = fs.promises;


var Spotify = require('enhanced-spotify-api');
var queue = new Map();
var download = new Map();
var activeSkips = new Map();
var lastSkip = new Map();
var needle = require('needle');

async function authoriseSpotify() {

    let basy = Buffer.from(config.spotifyClient + ':' + config.spotifySecret).toString('base64');

    let options = {
        headers: { 'Authorization': 'Basic ' + basy }
    };

    needle.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', options, function (err, resp) {
        if (err) console.log(err);
        if (resp) {
            Spotify.setAccessToken(resp.body.access_token);
            spotifyPlaylist();
        }
    })
}

authoriseSpotify();


async function spotifyPlaylist(message, params, user) {

    //if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    //let args = message.content.split(" ").slice(1).join(" ");

    let args = '37i9dQZF1DWYMfG0Phlxx8';

    let playlistTracks = await Spotify.Tracks.getPlaylistTracks(args);

    for (track in playlistTracks.items) {
        console.log("TRACK TITLE: ", playlistTracks.items[track].name)
        for(arty of playlistTracks.items[track].artists)
        console.log("ARTIST: ", arty.name)
    }



    // tracks = Object.entries(playlistTracks.items)

    // for (id of playlistTracks.order) {
    //     console.log(tracks.get(id));
    // }

    // for(let [id, track] of playlistTracks.items){
    //     console.log(track);
    // }
}

async function volume(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");
    const args = Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (args < 0) return message.channel.send("The volume cannot be set to 0!");
    if (args > 100) return message.channel.send("The max volume is 100!");

    let guildQueue = queue.get(message.guild.id);
    if (guildQueue) {
        guildQueue.dispatcher.setVolumeLogarithmic(args / 100);
    }

}
exports.volume = volume;

async function pause(message) {
    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");

    let guildQueue = queue.get(message.guild.id);
    if (guildQueue) {
        let song = guildQueue.songs[guildQueue.index];
        if (!song.paused) {
            song.paused = new Date();
        }
        guildQueue.dispatcher.pause();
    }

}
exports.pause = pause;

async function resume(message) {
    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");
    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {

        let song = guildQueue.songs[guildQueue.index];
        if (song.paused) {

            song.timePaused = (new Date() - song.paused) / 1000 + song.timePaused;
            song.paused = null;
        }
        queue.get(message.guild.id).dispatcher.resume();
    }
}
exports.resume = resume;

async function skip(message, params) {

    if (message.channel.type == 'dm') return message.reply("This is a server text-channel exclusive command!");
    let guildQueue = queue.get(message.guild.id);
    let skipy = lastSkip.get(message.guild.id);
    const args = Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (isNaN(args)) return message.channel.send("You have entered an invalid number!");
    if (Number(params) == 0) return message.channel.send("0 is not a valid number!");

    if (guildQueue) {

        if (!skipy) lastSkip.set(message.guild.id, new Date());
        if (((new Date()) - skipy) <= 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        lastSkip.set(message.guild.id, new Date());

        if ((args == 0) && (guildQueue.index != (guildQueue.songs.length - 1)))
            guildQueue.index++;
        else if (args == 0) return message.channel.send(`You're trying to skip too many songs!`);
        else if ((guildQueue.index + args) >= guildQueue.songs.length || (guildQueue.index + args) < 0)
            return message.channel.send(`You're trying to skip too many songs!`);
        else { guildQueue.index += args; }

        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        resetSong(guildQueue.songs[guildQueue.index]);
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}
exports.skip = skip;

async function reverse(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    const args = Math.floor(Number(message.content.split(" ").slice(1).join(" ")));

    if (isNaN(args)) return message.channel.send("You have entered an invalid number!");
    if (Number(params) == 0) return message.channel.send("0 is not a valid number!");

    if (guildQueue) {

        if ((args == 0) && (guildQueue.index != 0))
            guildQueue.index--;
        else if (args == 0) return message.channel.send(`You're trying to reverse too many songs!`);
        else if ((guildQueue.index - args) >= guildQueue.songs.length || (guildQueue.index - args) < 0)
            return message.channel.send(`You're trying to reverse too many songs!`);
        else { guildQueue.index -= args; }

        if (guildQueue.index == guildQueue.songs.length) guildQueue.songs = [];
        resetSong(guildQueue.songs[guildQueue.index]);
        playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    }
}
exports.reverse = reverse;

async function stop(message) {
    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (queue.get(message.guild.id)) {
        //queue.get(message.guild.id).dispatcher.destroy();
        await queue.get(message.guild.id).voiceChannel.leave();
        queue.delete(message.guild.id);
        download.delete(message.guild.id);
    }
}
exports.stop = stop;

async function forward(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);

    if (guildQueue) {

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

async function rewind(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);
    let song = guildQueue.songs[guildQueue.index];

    if (guildQueue) {

        if (Array.isArray(params)) params = params[0];
        if (!/^[:0-9]+$/.test(params.substr(1))) return message.channel.send("You have entered an invalid rewind format!");

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

async function seek(message, params) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    let guildQueue = queue.get(message.guild.id);


    if (guildQueue) {

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
async function shuffle(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This command must be called from a server text channel!");
    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing before seeing the shuffling!");

    MAIN.shuffleArray(guildQueue.songs);
    guildQueue.index = 0;
    playSong(message.guild, guildQueue.songs[guildQueue.index], null, message);
    message.channel.send("The playlist has been shuffled!");
}
exports.shuffle = shuffle;

async function goTo(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing!");

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

async function repeat(message, params, user) {

    if (!params.mode) {
        if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

        let guildQueue = queue.get(message.guild.id);
        if (!guildQueue) return message.channel.send("There needs to be a song playing!");

        const args = message.content.split(" ").slice(1).join(" ");
        if (!args || !isNaN(args)) return message.channel.send("You have to provide a valid repeat mode!");

        MAIN.generalMatcher(message, args, user, ["One", "All", "Off"], [{ mode: "One" }, { mode: "All" }, { mode: "Off" }], repeat, "Enter the number associted with repeat mode you want.");
    }
    else {

        let guildQueue = queue.get(message.guild.id);

        if (params.mode.localeCompare("One") == 0)
            guildQueue.repeat = 1;
        else if (params.mode.localeCompare("All") == 0)
            guildQueue.repeat = 100;
        else
            guildQueue.repeat = null;
        return message.channel.send(`Repeat mode set to ${params.mode}`);
    }
}
exports.repeat = repeat;

async function currentSong(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");

    let guildQueue = queue.get(message.guild.id);
    if (!guildQueue) return message.channel.send("There needs to be a song playing before seeing the progress!");
    let song = guildQueue.songs[guildQueue.index];

    let current = song.paused ? song.offset - song.timePaused + ((Math.floor(new Date() - song.start - ((new Date() - song.paused)))) / 1000)
        : song.offset - song.timePaused + ((Math.floor(new Date() - song.start)) / 1000);
    return message.channel.send("```md\n#" + song.title + "\n[" + MAIN.timeConvert(current) + "](" + MAIN.timeConvert(Math.floor(song.duration)) + ")```");
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
    if (!params) return message.reply("You need to provide a song to play!");
    let serverQueue = queue.get(message.guild.id);
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
            volume: 5,
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

    if (await ytpl.validateURL(args)) {
        //ytpl
        let playlist = await ytpl(args, { limit: 0 });
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
                cacheSong(song, message.guild.id);
            }
        } callPlay = true;
        message.channel.send(`${playlist.items.length} songs have been added to the queue!`);
    }
    else if (ytdl.validateURL(args)) {
        songInfo = await ytdl.getInfo(args, { quality: 'highestaudio' });
        if (songInfo.length_seconds) {
            let startTime = args.lastIndexOf('?t=');
            let offset = 0;

            if (startTime != -1) {

                let tester = args.substring(startTime + 3);
                offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
            }

            let song = {
                title: songInfo.title,
                url: songInfo.video_url,
                duration: songInfo.length_seconds,
                start: null,
                offset: offset,
                id: songInfo.video_id,
                paused: null,
                timePaused: 0,
                progress: 0
            };
            queueConstruct.songs.push(song);
            cacheSong(song, message.guild.id);

            if (queueConstruct.songs.length > 1) message.channel.send(`${songInfo.title} has been added to the queue!`)
            else {
                message.channel.send(`Now playing ${songInfo.title}!`)
                callPlay = true;
            }
        }
        else
            message.channel.send("I can't access that video, please try another!");
    }
    else {
        let searchResult = await ytsr(args, { limit: 10 });

        let titleArray = [];
        let urlArray = [];

        for (let i = 0; i < searchResult.items.length || titleArray.length == 5; i++) {

            if (searchResult.items[i].type == 'video') {
                titleArray.push(searchResult.items[i].title);
                urlArray.push({ url: searchResult.items[i].link, custom: true });
            }
        }

        return MAIN.generalMatcher(message, searchResult.query, user, titleArray, urlArray, play, "Please enter the number matching the video you wish to play!");
    }

    if (callPlay) {
        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            playSong(message.guild, queueConstruct.songs[0], null, message);
        } catch (err) {
            console.log(err);
            Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
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

async function playSong(guild, sonG, skip, message) {
    const serverQueue = queue.get(guild.id);
    let song = sonG;

    if (!song) {
        message.channel.send(`No more songs queued, leaving!`);
        stop(message);
        return;
    }

    let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');
    let audioOutputExists = false;
    await fsPromises.access(audioOutput)
        .then(() => { audioOutputExists = true; })
        .catch(() => { })

    if (!song.start && (song.offset > 0) && !audioOutputExists && !skip) {
        return forward(message, song.offset)
    }

    if (audioOutputExists) {

        const Dispatcher = await serverQueue.connection.play(audioOutput, { seek: song.offset })
            .on('error', error => {
                console.log("Error inside of dispatcher playing?: ", error);
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

        console.log(`toDownload ${percentageToDownload} || toSkip ${percentageToSkip}`);

        if ((percentageToSkip > percentageToDownload) && (download.get(guild.id).songToDownload.id == song.id)) {
            console.log("chose to wait");

            return setTimeout(playSong, 1000, guild, song, skip, message);
        }
        else {
            return playSong(guild, song, -1, message)
        }
    }
    else {
        console.log("inside of else", song.url, song.title);

        //Create a seperate read stream solely for buffering the audio so that it doesn't hold up the previous write stream

        let streamResolve = await ytdl(song.url, { format: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });

        const Dispatcher = await serverQueue.connection.play(streamResolve, { seek: song.offset })
            .on('error', error => {
                console.log("inside of error   ", error);
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
async function cacheSong(song, guild) {

    if (!download.get(guild) && song) {

        download.set(guild,
            {
                songToDownload: null,
                progress: 0,
                leftOver: [JSON.parse(JSON.stringify(song))]
            }
        );
    }

    let serverDownload = download.get(guild);

    if (!serverDownload) return -1;
    if (!serverDownload.songToDownload && serverDownload.leftOver.length > 0) {

        serverDownload.songToDownload = serverDownload.leftOver.shift();
        song = serverDownload.songToDownload;

        let tempAudio = path.resolve(`songs`, song.id + '.mp3');
        let audioOutput = path.resolve(`songs`, `finished`, song.id + '.mp3');

        let audioExists = false;
        let tempAudioExists = false;

        await fsPromises.access(audioOutput)
            .then(() => { audioExists = true; })
            .catch(() => { })

        await fsPromises.access(tempAudioExists)
            .then(() => { tempAudioExists = true; })
            .catch(() => { })

        if (audioExists) {
            serverDownload.songToDownload = null;
            serverDownload.progress = 0;
            cacheSong(null, guild);
            return;
        }

        if (!tempAudioExists && !audioExists) {
            console.log("interesting")

            let downloadYTDL = require('ytdl-core');
            let youtubeResolve = downloadYTDL(song.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
            let writeStream = fs.createWriteStream(tempAudio);
            writeStream.on('finish', () => {
                console.log("FINISHED: WRITE STREAM " + song.title);
                mv(tempAudio, audioOutput, function (err) {
                    if (err) {
                        console.log(err);
                        Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
                    }
                    serverDownload.songToDownload = null;
                    serverDownload.progress = 0;
                    cacheSong(null, guild);
                });
            });

            youtubeResolve.on('progress', (chunkLength, downloaded, total) => {
                const percent = downloaded / total;
                readline.cursorTo(process.stdout, 0);
                song.progress = Math.floor((percent * 100).toFixed(2));
                if (download.get(guild))
                    download.get(guild).progress = song.progress;
            });
            youtubeResolve.pipe(writeStream);
        }
    }
    else if (song) {
        serverDownload.leftOver.push(JSON.parse(JSON.stringify(song)));
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
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

    const args = params.custom ? params.url : message.content.split(" ").slice(1).join(" ");
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
            songInfo = await ytdl.getInfo(params, { quality: 'highestaudio' });

            if (songInfo.length_seconds) {
                let startTime = params.lastIndexOf('?t=');
                let offset = 0;

                if (startTime != -1) {

                    let tester = params.substring(startTime + 3);
                    offset = (tester.length > 0 && !isNaN(tester)) ? Number(tester) : 0;
                }

                song = {
                    title: songInfo.title,
                    url: songInfo.video_url,
                    duration: songInfo.length_seconds,
                    start: null,
                    offset: offset,
                    id: songInfo.video_id,
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
        return User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
    }
}
exports.addSong = addSong;

async function savePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("This command is exculsive to server channels!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

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
        return User.findOneAndUpdate({ id: user.id }, { $set: { playlists: user.playlists } }, function (err, doc, res) { });
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
                console.log(err);
                Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
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
    console.log("START: ", playUserPlayList);

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");
    let serverQueue = queue.get(message.guild.id);

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
                volume: 5,
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
                });
                cacheSong({ id: video.id, url: video.url });
            }
        }
        message.channel.send(`${params.playlist.songs.length} songs have been added to the queue!`);

        if (callPlay) {
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                playSong(message.guild, queueConstruct.songs[0], null, message);
            } catch (err) {
                console.log(err);
                Client.guilds.cache.get(MAIN.guildID).channels.cache.get(MAIN.logID).send(err);
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
        console.log("REIGHT BEFORE::::", playUserPlayList);
        return MAIN.generalMatcher(message, query, user, promptArray, internalArray, playUserPlayList, `Enter the number of the playlist you wish to load the songs from!`)
    }
}
exports.playUserPlayList = playUserPlayList;

async function removePlayList(message, params, user) {

    if (message.channel.type == 'dm') return message.reply("You must be in a voice channel!");
    if (user.playlists.length == 0) return message.channel.send("You don't have any playlists! Create one first by typing *" + prefix + "createPlaylist*");

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

        MAIN.prettyEmbed(message, `Here are the songs for **${params.title}**`, fieldArray, -1, 1, 1);
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
    if (message.content.toLowerCase() == (prefix + "createplaylist")) return message.channel.send("You need to provide a name for the new playlist.")

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

    MAIN.prettyEmbed(message, `There are a total of ${songQueue.songs.length} songs queued. Total duration: ${MAIN.timeConvert(totalDuration)}`,
        fieldArray, -1, -1, 'md');
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

    if (queue.size > 0)
        for (server of queue.entries()) {
            if (server[1].connection.channel.members.size == 1) {
                server[1].originMessage.channel.send("Leaving because there is no one listening!");
                await server[1].voiceChannel.leave();
                download.delete(server[1].originMessage.guild.id);
                queue.delete(server[0]);
            }
        }
}

setInterval(authoriseSpotify, 50 * 60 * 1000);
setInterval(checkEmptyChannel, 60 * 1000);