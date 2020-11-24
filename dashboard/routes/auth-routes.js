const express = require('express');

const router = express.Router();
const CONFIG = require('../../config.json');
const Guild = require('../../Guild');
const MAIN = require('../../scraper.js');
const User = require('../../User');
const authClient = require('../modules/auth-client.js');
const sessions = require('../modules/sessions.js');
const { validateKey } = require('../modules/middleware.js');

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


router.post('/formUpdate/playlistUpdate', validateKey, async function (req, res) {

    console.log('/formUpdate/playlistUpdate');

    res.locals.dbUser = await MAIN.findUser({ id: res.locals.validatedUser.id });

    if (req.body.playlistTitle) {

        let playlist = res.locals.dbUser.playlists.find(element => element.title === req.body.playlistTitle);

        if (playlist) {

            if (req.body.removeSongList)
                if (req.body.removeSongList.length > 0) {

                    for (let songToRemove of req.body.removeSongList) {

                        for(let i = 0; i < playlist.songs.length; i++) {

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

    if (req.body.removeGames)
        for (let game of req.body.removeGames)
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
        maybe: user
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
        maybe: user
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
        maybe: user
    }).end();


    MAIN.sendToBot({
        command: 'updateCache',
        params: params
    });

});

module.exports = router;