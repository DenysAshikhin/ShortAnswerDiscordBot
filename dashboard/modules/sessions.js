const Cache = require('caching-map');
const authClient = require('./auth-client.js');
const MAIN = require('../../scraper.js');
const sessions = new Cache(1000);

const get = function (key) {

    console.log(`Number of sessions: ${sessions.size}`);

    if (sessions.get(key)) {

        return sessions.get(key);//could be optimised but w/e
    }
    return create(key);
}

const create = async function (key) {

    await update(key);

    return sessions.get(key);
}

const update = async function (key) {

    // console.log('big keY: ')
    // console.log(key)

    return sessions.set(key, {
        authUser: await authClient.getUser(key),
        guilds: getManageableGuilds(await authClient.getGuilds(key))
    },
        { ttl: 24* 60 * 60 * 1000 });
}


const getManageableGuilds = function (authGuilds) {

    const guilds = [];
    const bot = MAIN.Client;

    for (const id of authGuilds.keys()) {

        const guild = bot.guilds.cache.get(id);
        const isManager = authGuilds.get(id).permissions.includes('MANAGE_GUILD');

        const tempGuild = authGuilds.get(id);

        if (!guild) {
            continue;
        }

        guilds.push(guild)
    }
    return guilds;
}

module.exports.get = get;
module.exports.update = update;