const express = require('express');
const router = express.Router();
const CONFIG = require('../../config.json');
const MAIN = require('../../scraper.js');
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

    }
    catch (err) {

        console.log(err)
        
        console.log('inside auth error')
        res.render('errors/401');
    }
});


router.get('/auth-guild', async function (req, res) {

    try {

        const key = res.cookies.get('key');
        await sessions.update(key);
    }
    catch (err) {

        res.redirect('/dashboard');
    }
    finally {
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
module.exports = router;