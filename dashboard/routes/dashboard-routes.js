const express = require('express');
const router = express.Router();
const MAIN = require('../../scraper.js');
const { validateGuild } = require('../modules/middleware.js');

router.get('/dashboard', function (req, res) {
    res.render('dashboard/index', {
        something: "Null",
        subtitle: "Short Answer Bot Dasboard"
    });
    //res.send('Hello World')
});

router.get('/servers/:id', validateGuild, function (req, res) {
    res.render('dashboard/show', {
        something: "Null",
        subtitle: "Short Answer Bot Dashboard"
    });
    //res.send('Hello World')
});

module.exports = router;