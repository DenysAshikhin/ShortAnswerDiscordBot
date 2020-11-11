const CONFIG = require('../../config.json');
const MAIN = require('../../scraper.js');

const OAuthClient = require('disco-oauth');
// const Client = new OAuthClient(`${MAIN.Client.user.id}`, CONFIG.TesterSecret);
// console.log('secret: ', CONFIG.TesterSecret, " |||| ", MAIN.Client.user.id)
console.log('secret: ', CONFIG.clienSecret)
const Client = new OAuthClient(`689315272531902606`, CONFIG.clienSecret);
console.log(`${MAIN.REDIRECT_URL}/auth`);
Client.setRedirect(`${MAIN.REDIRECT_URL}/auth`);
Client.setScopes('identify', 'guilds');



module.exports = Client;