const express = require('express');
const router = express.Router();
const CONFIG = require('../../config.json');
const authClient = require('./auth-client.js');
const sessions = require('./sessions');

const MAIN = require('../../scraper.js');
const Guild = require('../../Guild.js');


module.exports.checkHTTP = function (req, res, next) {

    if (req.protocol === 'http') {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
    } else
        next();
}

module.exports.validateUser = async function (req, res, next) {


    console.log('in validateUser')

    if (res.locals.user)
        next();
    else {

        console.log('failed to validate user')
        res.render('errors/401');
    }

}

module.exports.updateUser = async function (req, res, next) {

    try {

        console.log('in updateUser');
        const key = res.cookies.get('key');

        if (key) {

            res.locals.user = (await sessions.get(key)).authUser;
            console.log('updateUser succesfuly')
        } else {
            res.locals.user = null;
            console.log('no key in cache')
        }
    } catch (err) {
        console.log(err);
        console.log('error setting the user');
        res.locals.user = null;
    } finally {
        next();
    }
}


module.exports.validateGuild = async function (req, res, next) {

    console.log('Validating guild')

    res.locals.guild = res.locals.guilds.find(function (guildy) {

        return guildy.id === req.params.id
    });


    if (res.locals.guild) {

        let promiseArray = [MAIN.findUser({
            id: res.locals.user.id,
            guild: {
                id: res.locals.guild.id
            }
        }, true), Guild.findOne({
            id: res.locals.guild.id
        })]


        let finishArray = await Promise.all(promiseArray);

        res.locals.dbUser = finishArray[0];
        res.locals.dbGuild = finishArray[1];


        if (!res.locals.dbGuild) {

            console.log('having to create a guildyyy');
            await MAIN.createGuild({
                id: res.locals.guild.id,
                name: res.locals.guild.name
            });
            res.locals.dbGuild = await Guild.findOne({
                id: res.locals.guild.id
            });
        }


        console.log(`Setting user: ${res.locals.dbUser.displayName}`)
        console.log(`Setting Guild: ${res.locals.dbGuild.id}`)


        if (res.locals.dbGuild.prefix == '-1')
            res.locals.guildPrefix = 'sa!';
        else
            res.locals.guildPrefix = res.locals.dbGuild.prefix;

        let index = res.locals.dbUser.guilds.indexOf(res.locals.dbGuild.id);

        if (index == -1) {
            console.log("This bug is ridunculous")
            res.locals.userPrefix = 'sa!';
        }
        else
            res.locals.userPrefix = res.locals.dbUser.prefix[index];

        if (res.locals.guild.members.cache.get(res.locals.dbUser.id).hasPermission("ADMINISTRATOR")) {
            // console.log('IS ADMIN')
            res.locals.admin = true;
        } else
            res.locals.admin = false;

        next();
    } else
        res.render('errors/404');
}


module.exports.validateKey = async function(req,res,next){
    
    console.log('in validateKey middleware');

    try {
        const code = req.body.key;
        const user = await authClient.getUser(code);
        res.locals.validatedUser = user;

        next();
    } catch (err) {

        console.log(err)
        console.log('error parsing the provided key');
        res.status(400).end();
    }

}

module.exports.updateGuilds = async function (req, res, next) {

    try {

        const key = res.cookies.get('key');
        console.log('inside updateGuilds');
        if (key) {
            res.locals.guilds = (await sessions.get(key)).guilds;
        } else
            res.locals.guilds = null;
    } catch (err) {

        console.log(err)
        console.log('error setting the GUILD');
        res.locals.guilds = null;
    } finally {
        next();
    }
}