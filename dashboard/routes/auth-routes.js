const express = require('express');
const router = express.Router();
const CONFIG = require('../../config.json');
const MAIN = require('../../scraper.js');
const authClient = require('../auth-client.js');


router.get('/login', function (req, res) {

    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=689315272531902606&redirect_uri=${MAIN.REDIRECT_URL}/auth&response_type=code&scope=identify guilds&prompt=none`);
});

router.get('/auth', async function (req, res) {

    try {
        const code = req.query.code;
        const token = await authClient.getAccess(code);

        console.log('trying to set')
        console.log(token);

        //res.Cookies.set('key', token);
        res.cookies.set('key', token)
        res.redirect('/dashboard');

    }
    catch (err) {

        res.render('errors/401');
    }
});

router.get('/logout', function (req, res) {


    console.log('deleting key and redirecting');

    res.cookies.set('key', '');

    res.redirect('/');
});


module.exports = router;