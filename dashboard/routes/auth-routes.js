const express = require('express');
const {
    GridFSBucket
} = require('mongodb');
const router = express.Router();
const CONFIG = require('../../config.json');
const Guild = require('../../Guild');
const MAIN = require('../../scraper.js');
const User = require('../../User');
const authClient = require('../modules/auth-client.js');
const sessions = require('../modules/sessions.js');

router.get('/login', function (req, res) {

    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=689315272531902606&redirect_uri=${MAIN.REDIRECT_URL}/auth&response_type=code&scope=identify guilds&prompt=none`);
});

router.get('/auth', async function (req, res) {

    try {
        const code = req.query.code;

        console.log(code)

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


router.post('/formUpdate', async function (req, res) {

    //console.log(req.body)
    console.log('WE GO SOMETHING')


    try {
        const code = req.body.key;
        const user = await authClient.getUser(code);

        let dbUser = await User.findOne({
            id: user.id
        });

        let index = dbUser.guilds.indexOf(req.body.serverID);

        if (index == -1) {
            res.status(400).json({
                message: 'Error code: Prefix Missing. Please notify the owner in the support server of this issue to get it fixed ASAP!'
            }).end();
        }

        let guild = MAIN.Client.guilds.cache.get(req.body.serverID);

        let isAdmin = guild.members.cache.get(user.id).hasPermission("ADMINISTRATOR");

        let params = [dbUser.id, guild.id];

        if (req.body.userPrefix.length > 0)
            if ((req.body.userPrefix == '-1') || (req.body.userPrefix == 'sa!'))
                dbUser.prefix[index] = '-1';
            else
                dbUser.prefix[index] = req.body.userPrefix;


        User.findOneAndUpdate({
            id: user.id
        }, {
            $set: {
                prefix: dbUser.prefix
            }
        }).exec();

        if (isAdmin)
            if (req.body.serverPrefix.length > 0)
                if ((req.body.serverPrefix != '-1') || (req.body.serverPrefix != 'sa!'))
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

    } catch (err) {

        console.log(err)
        console.log('error parsing the provided key');
        res.status(400).end();
    }

});


module.exports = router;