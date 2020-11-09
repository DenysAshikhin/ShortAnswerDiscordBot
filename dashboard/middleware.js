const express = require('express');
const router = express.Router();
const CONFIG = require('../config.json');
const authClient = require('./auth-client.js');


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
        if (key)
            res.locals.user = await authClient.getUser(key);
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