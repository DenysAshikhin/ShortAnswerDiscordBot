const express = require('express');
const router = express.Router();
const CONFIG = require('../../config.json');
const authClient = require('./auth-client.js');
const sessions = require('./sessions');

const MAIN = require('../../scraper.js');


module.exports.checkHTTP = function (req, res, next) {

    if (req.protocol === 'http') {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    else
        next();
}

module.exports.validateUser = async function (req, res, next) {

    if (res.locals.user)
        next();
    else
        res.render('errors/401');
}

module.exports.updateUser = async function (req, res, next) {

    try {

        const key = res.cookies.get('key');
        console.log('setting the user');
        if (key) {

            res.locals.user = (await sessions.get(key)).authUser;
        }
        else
            res.locals.user = null;
    }
    catch (err) {
        console.log(err);
        console.log('error setting the user');
        res.locals.user = null;
    }
    finally {
        next();
    }
}

module.exports.updateGuilds = async function (req, res, next) {

    try {

        const key = res.cookies.get('key');
        console.log('setting the GUILDS');
        if (key) {
            res.locals.guilds = (await sessions.get(key)).guilds;
        }
        else
            res.locals.guilds = null;
    }
    catch (err) {

        console.log(err)
        console.log('error setting the GUILD');
        res.locals.user = null;
    }
    finally {
        next();
    }
}