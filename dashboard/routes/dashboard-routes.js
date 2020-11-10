const express = require('express');
const router = express.Router();
const MAIN = require('../../scraper.js');

router.get('/dashboard', function (req, res) {
    res.render('dashboard/index', {
        something: "Null",
        subtitle: "Short Answer Bot Dasboard"
    });
    //res.send('Hello World')
});

router.get('/servers/:id', function (req, res) {
    res.render('dashboard/show', {
        something: "Null",
        subtitle: "Short Answer Bot Dashboard",
        guild: MAIN.Client.guilds.cache.get(req.params.id)
    });
    //res.send('Hello World')
});

module.exports = router;