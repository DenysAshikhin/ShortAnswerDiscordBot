const express = require('express');
const app = express();
const path = require('path');
const MAIN = require('../scraper.js');
const PORT = MAIN.config.dashboardPort;
const rootRoutes = require('./routes/root-routes.js');
const authRoutes = require('./routes/auth-routes.js');
const dashboardRoutes = require('./routes/dashboard-routes.js');
const Cookies = require('cookies');
const middleware = require('./middleware.js');

var https = require('https');
var http = require('http');
var fs = require('fs');

var Commands = require('../commands.json');


app.set('views', __dirname + '/views');
app.set('view engine', 'pug')
app.use(express.static(`${__dirname}/assets`));
app.use(Cookies.express('a', 'b', 'c'));
app.locals.basedir = `${__dirname}/assets`;


app.use((req, res, next) => {
    if (req.protocol === 'http') {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    else
        next();
});







const sslPath = path.join(__dirname, '..', 'ssl');

var serverOptions = {
    key: fs.readFileSync(path.join(sslPath, 'privateKey.key')),
    cert: fs.readFileSync(path.join(sslPath, `shortanswerbot_ca.crt`)),
    ca: fs.readFileSync(path.join(sslPath, `shortanswerbot_ca.ca-bundle`))
};

var checkCommandsSearchArray = Commands.reduce((accum, curr) => {
    accum.upperCase.push(curr.title.toUpperCase());
    accum.normal.push(curr.title);
    return accum;
}, { upperCase: [], normal: [] });

var httpServer;
var httpsServer

const initialise = async function () {

    app.use('/',
        middleware.updateUser,
        rootRoutes,
        authRoutes);
    app.use('/dashboard', middleware.validateUser, dashboardRoutes);
    app.get('*', (req, res) => res.render('errors/404'));


    httpsServer = https.createServer(serverOptions, app);
    httpServer = http.createServer(app);

    httpsServer.listen(443, MAIN.HOST);
    httpServer.listen(80, MAIN.HOST);
}
exports.initialise = initialise;