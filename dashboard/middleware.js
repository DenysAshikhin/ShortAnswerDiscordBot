const express = require('express');
const router = express.Router();
const CONFIG = require('../config.json');
const authClient = require('./auth-client.js');

const MAIN = require('../scraper.js');



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
            res.locals.user = await authClient.getUser(key);

        }
        else
            res.locals.user = null;
    }
    catch (err) {

        //console.log(err)

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

            const authGuilds = await authClient.getGuilds(key);
            res.locals.guilds = getManageableGuilds(authGuilds);
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

const getManageableGuilds = function (authGuilds) {

    const guilds = [];
    const bot = MAIN.Client;

    for (const id of authGuilds.keys()) {

        const guild = bot.guilds.cache.get(id);
        const isManager = authGuilds.get(id).permissions.includes('MANAGE_GUILD');

        const tempGuild = authGuilds.get(id);

        if (!guild || !isManager) {
            continue;
        }

        guilds.push(guild)
    }
    return guilds;
}