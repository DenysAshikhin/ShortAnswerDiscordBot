const MAIN = require('./short-answer.js');

var zoneList = populateTimeZones();

function populateTimeZones() {
    let zones = "ACDT	Australian Central Daylight Saving Time	UTC+10:30 ACST	Australian Central Standard Time	UTC+09:30 ACT	Acre Time	UTC-05  ACWST	Australian Central Western Standard Time (unofficial)	UTC+08:45 ADT	Atlantic Daylight Time	UTC-03 AEDT	Australian Eastern Daylight Saving Time	UTC+11 AEST	Australian Eastern Standard Time	UTC+10  AFT	Afghanistan Time	UTC+04:30 AKDT	Alaska Daylight Time	UTC-08 AKST	Alaska Standard Time	UTC-09 ALMT	Alma-Ata Time[1]	UTC+06 AMST	Amazon Summer Time (Brazil)[2]	UTC-03 AMT	Amazon Time (Brazil)[3]	UTC-04 AMT	Armenia Time	UTC+04 ANAT	Anadyr Time[4]	UTC+12 AQTT	Aqtobe Time[5]	UTC+05 ART	Argentina Time	UTC-03 AST	Arabia Standard Time	UTC+03 AST	Atlantic Standard Time	UTC-04 AWST	Australian Western Standard Time	UTC+08 AZOST	Azores Summer Time	UTC+00 AZOT	Azores Standard Time	UTC-01 AZT	Azerbaijan Time	UTC+04 BDT	Brunei Time	UTC+08 BIOT	British Indian Ocean Time	UTC+06 BIT	Baker Island Time	UTC-12 BOT	Bolivia Time	UTC-04 BRST	Brasília Summer Time	UTC-02 BRT	Brasília Time	UTC-03 BST	Bangladesh Standard Time	UTC+06 BST	Bougainville Standard Time[6]	UTC+11 BST	British Summer Time UTC+01 BTT	Bhutan Time	UTC+06 CAT	Central Africa Time	UTC+02 CCT	Cocos Islands Time	UTC+06:30 CDT	Central Daylight Time (North America)	UTC-05 CDT	Cuba Daylight Time[7]	UTC-04 CEST	Central European Summer Time (Cf. HAEC)	UTC+02 CET	Central European Time	UTC+01 CHADT	Chatham Daylight Time	UTC+13:45 CHAST	Chatham Standard Time	UTC+12:45 CHOT	Choibalsan Standard Time	UTC+08 CHOST	Choibalsan Summer Time	UTC+09 CHST	Chamorro Standard Time	UTC+10 CHUT	Chuuk Time	UTC+10 CIST	Clipperton Island Standard Time	UTC-08 CIT	Central Indonesia Time	UTC+08 CKT	Cook Island Time	UTC-10 CLST	Chile Summer Time	UTC-03 CLT	Chile Standard Time	UTC-04 COST	Colombia Summer Time	UTC-04 COT	Colombia Time	UTC-05 CST	Central Standard Time (North America)	UTC-06 CST	China Standard Time	UTC+08 CST	Cuba Standard Time	UTC-05 CT	China Time	UTC+08 CVT	Cape Verde Time	UTC-01 CWST	Central Western Standard Time (Australia) unofficial	UTC+08:45 CXT	Christmas Island Time	UTC+07 DAVT	Davis Time	UTC+07 DDUT	Dumont d'Urville Time	UTC+10 DFT	AIX-specific equivalent of Central European Time[NB 1]	UTC+01 EASST	Easter Island Summer Time	UTC-05 EAST	Easter Island Standard Time	UTC-06 EAT	East Africa Time	UTC+03 ECT	Eastern Caribbean Time (does not recognise DST)	UTC-04 ECT	Ecuador Time	UTC-05 EDT	Eastern Daylight Time (North America)	UTC-04 EEST	Eastern European Summer Time	UTC+03 EET	Eastern European Time	UTC+02 EGST	Eastern Greenland Summer Time	UTC+00 EGT	Eastern Greenland Time	UTC-01 EIT	Eastern Indonesian Time	UTC+09 EST	Eastern Standard Time (North America)	UTC-05 FET	Further-eastern European Time	UTC+03 FJT	Fiji Time	UTC+12 FKST	Falkland Islands Summer Time	UTC-03 FKT	Falkland Islands Time	UTC-04 FNT	Fernando de Noronha Time	UTC-02 GALT	Galápagos Time	UTC-06 GAMT	Gambier Islands Time	UTC-09 GET	Georgia Standard Time	UTC+04 GFT	French Guiana Time	UTC-03 GILT	Gilbert Island Time	UTC+12 GIT	Gambier Island Time	UTC-09 GMT	Greenwich Mean Time	UTC+00 GST	South Georgia and the South Sandwich Islands Time	UTC-02 GST	Gulf Standard Time	UTC+04 GYT	Guyana Time	UTC-04 HDT	Hawaii-Aleutian Daylight Time	UTC-09 HAEC	Heure Avancée d'Europe Centrale French-language name for CEST	UTC+02 HST	Hawaii-Aleutian Standard Time	UTC-10 HKT	Hong Kong Time	UTC+08 HMT	Heard and McDonald Islands Time	UTC+05 HOVST	Hovd Summer Time (not used from 2017-present)	UTC+08 HOVT	Hovd Time	UTC+07 ICT	Indochina Time	UTC+07 IDLW	International Day Line West time zone	UTC-12 IDT	Israel Daylight Time	UTC+03 IOT	Indian Ocean Time	UTC+03 IRDT	Iran Daylight Time	UTC+04:30 IRKT	Irkutsk Time	UTC+08 IRST	Iran Standard Time	UTC+03:30 IST	Indian Standard Time	UTC+05:30 IST	Irish Standard Time[8]	UTC+01 IST	Israel Standard Time	UTC+02 JST	Japan Standard Time	UTC+09 KALT	Kaliningrad Time	UTC+02 KGT	Kyrgyzstan Time	UTC+06 KOST	Kosrae Time	UTC+11 KRAT	Krasnoyarsk Time	UTC+07 KST	Korea Standard Time	UTC+09 LHST	Lord Howe Standard Time	UTC+10:30 LHST	Lord Howe Summer Time	UTC+11 LINT	Line Islands Time	UTC+14 MAGT	Magadan Time	UTC+12 MART	Marquesas Islands Time	UTC-09:30 MAWT	Mawson Station Time	UTC+05 MDT	Mountain Daylight Time (North America)	UTC-06 MET	Middle European Time Same zone as CET	UTC+01 MEST	Middle European Summer Time Same zone as CEST	UTC+02 MHT	Marshall Islands Time	UTC+12 MIST	Macquarie Island Station Time	UTC+11 MIT	Marquesas Islands Time	UTC-09:30 MMT	Myanmar Standard Time	UTC+06:30 MSK	Moscow Time	UTC+03 MST	Malaysia Standard Time	UTC+08 MST	Mountain Standard Time (North America)	UTC-07 MUT	Mauritius Time	UTC+04 MVT	Maldives Time	UTC+05 MYT	Malaysia Time	UTC+08 NCT	New Caledonia Time	UTC+11 NDT	Newfoundland Daylight Time	UTC-02:30 NFT	Norfolk Island Time	UTC+11 NOVT	Novosibirsk Time [9]	UTC+07 NPT	Nepal Time	UTC+05:45 NST	Newfoundland Standard Time	UTC-03:30 NT	Newfoundland Time	UTC-03:30 NUT	Niue Time	UTC-11 NZDT	New Zealand Daylight Time	UTC+13 NZST	New Zealand Standard Time	UTC+12 OMST	Omsk Time	UTC+06 ORAT	Oral Time	UTC+05 PDT	Pacific Daylight Time (North America)	UTC-07 PET	Peru Time	UTC-05 PETT	Kamchatka Time	UTC+12 PGT	Papua New Guinea Time	UTC+10 PHOT	Phoenix Island Time	UTC+13 PHT	Philippine Time	UTC+08 PKT	Pakistan Standard Time	UTC+05 PMDT	Saint Pierre and Miquelon Daylight Time	UTC-02 PMST	Saint Pierre and Miquelon Standard Time	UTC-03 PONT	Pohnpei Standard Time	UTC+11 PST	Pacific Standard Time (North America)	UTC-08 PST	Philippine Standard Time	UTC+08 PYST	Paraguay Summer Time[10]	UTC-03 PYT	Paraguay Time[11]	UTC-04 RET	Réunion Time	UTC+04 ROTT	Rothera Research Station Time	UTC-03 SAKT	Sakhalin Island Time	UTC+11 SAMT	Samara Time	UTC+04 SAST	South African Standard Time	UTC+02 SBT	Solomon Islands Time	UTC+11 SCT	Seychelles Time	UTC+04 SDT	Samoa Daylight Time	UTC-10 SGT	Singapore Time	UTC+08 SLST	Sri Lanka Standard Time	UTC+05:30 SRET	Srednekolymsk Time	UTC+11 SRT	Suriname Time	UTC-03 SST	Samoa Standard Time	UTC-11 SST	Singapore Standard Time	UTC+08 SYOT	Showa Station Time	UTC+03 TAHT	Tahiti Time	UTC-10 THA	Thailand Standard Time	UTC+07 TFT	French Southern and Antarctic Time[12]	UTC+05 TJT	Tajikistan Time	UTC+05 TKT	Tokelau Time	UTC+13 TLT	Timor Leste Time	UTC+09 TMT	Turkmenistan Time	UTC+05 TRT	Turkey Time	UTC+03 TOT	Tonga Time	UTC+13 TVT	Tuvalu Time	UTC+12 ULAST	Ulaanbaatar Summer Time	UTC+09 ULAT	Ulaanbaatar Standard Time	UTC+08 UTC	Coordinated Universal Time	UTC+00 UYST	Uruguay Summer Time	UTC-02 UYT	Uruguay Standard Time	UTC-03 UZT	Uzbekistan Time	UTC+05 VET	Venezuelan Standard Time	UTC-04 VLAT	Vladivostok Time	UTC+10 VOLT	Volgograd Time	UTC+04 VOST	Vostok Station Time	UTC+06 VUT	Vanuatu Time	UTC+11 WAKT	Wake Island Time	UTC+12 WAST	West Africa Summer Time	UTC+02 WAT	West Africa Time	UTC+01 WEST	Western European Summer Time	UTC+01 WET	Western European Time	UTC+00 WIT	Western Indonesian Time	UTC+07 WGST	West Greenland Summer Time[13]	UTC-02 WGT	West Greenland Time[14]	UTC-03 WST	Western Standard Time	UTC+08 YAKT	Yakutsk Time	UTC+09 YEKT	Yekaterinburg Time	UTC+05";

    zones = zones.split("\t");

    let finalList = [];

    let timeZone = '';

    let counter = 2;
    finalList.push({ tz: zones[0], offset: zones[2].substring(3, zones[2].lastIndexOf(' ')) });
    finalList.push({ tz: zones[2].substring(zones[2].lastIndexOf(' ') + 1), offset: zones[4].substring(3, zones[4].lastIndexOf(' ')) });

    for (let i = 4; i < (zones.length - 1); i++) {

        let item = zones[i];

        if (!item.includes("UTC")) continue;

        if (item.substring(item.lastIndexOf(' ') + 1) == zones[i - 2].substring(zones[i - 2].lastIndexOf(' ') + 1)) {

            if (finalList[counter - 1].tz.substring(finalList[counter - 1].tz.indexOf('-') + 2) != zones[i - 1])
                finalList[counter - 1].tz = finalList[counter - 1].tz + ' - ' + zones[i - 1];
            finalList.push({ tz: item.substring(item.lastIndexOf(' ') + 1) + ' - ' + zones[i + 1], offset: zones[i + 2].substring(3, zones[i + 2].lastIndexOf(' ')) })
        }
        else {
            finalList.push({ tz: item.substring(item.lastIndexOf(' ') + 1), offset: zones[i + 2].substring(3, zones[i + 2].lastIndexOf(' ')) })
        }

        counter++;
    }
    return finalList;
}

async function timeZone(message, params, user) {

    let args = message.content.split(" ").slice(1).join(" ").split(',');

    if (!args[1])
        return message.channel.send("You have to specify a time and time zone, refer to the help command `help timezone` for more info!");
    args[1] = args[1].trim();
    if (!args[1].includes(':')) return message.channel.send("You have entered an invalid time format!");
    if (!/^[:0-9]+$/.test((args[1]))) return message.channel.send("You have entered an invalid time format!");

    args[1] = args[1].split(":");
    args[1][0] = Number(args[1][0]);
    args[1][1] = Number(args[1][1]);
    if ((args[1][0] > 12) || (args[1][0] < 0)) return message.channel.send("The hours are limited to 0<=x<=24!");
    if ((args[1][1] > 59) || (args[1][1] < 0)) return message.channel.send("The minutes are limited to 0<=x<=59!");

    if (params.origin) args[0] = params.origin;
    if (params.destination) args[2] = params.destination;

    if (args.length < 3) return message.channel.send("You did not provide proper parameters, use the help command to for more information.");



    let indexOri = zoneList.find((value) => { return value.tz == args[0].trim().toUpperCase() });

    if (!indexOri) {

        return MAIN.generalMatcher(message, args[0], user, zoneList.reduce((accum, current) => { accum.push(current.tz); return accum; }, []),
            zoneList.reduce((accum, current) => { accum.push({ origin: current.tz }); return accum; }, []),
            timeZone, "Please select which origin timezone you meant:");
    }
    else
        args[0] = indexOri.tz;

    let finalMessage = ""

    if (args.length > 3) {
        message.channel.send('Target timezones checks are disabled when there are more than 1 target timezone listed ')
    }

    for (let i = 2; i < args.length; i++) {

        let indexDes = zoneList.find((value) => { return value.tz == args[i].trim().toUpperCase() });

        if (!indexDes) {

            if (args.length == 3)
                return MAIN.generalMatcher(message, args[i], user, zoneList.reduce((accum, current) => { accum.push(current.tz); return accum; }, []),
                    zoneList.reduce((accum, current) => { accum.push({ origin: args[0], destination: current.tz }); return accum; }, []),
                    timeZone, "Please select which Target timezone you meant:");
        }
        else
            args[i] = indexDes.tz;

        let oriOff = Number(indexOri.offset.split(':')[0]) * 60;
        if (indexOri.offset.split(':').length == 2)
            oriOff = (oriOff < 0) ? oriOff - Number(indexOri.offset.split(':')[1]) : oriOff + Number(indexOri.offset.split(':')[1])

        let desOff = Number(indexDes.offset.split(':')[0]) * 60;
        if (indexDes.offset.split(':').length == 2)
            desOff = (desOff < 0) ? desOff - Number(indexDes.offset.split(':')[1]) : desOff + Number(indexDes.offset.split(':')[1])

        let givenTime = Number(args[1][0]) * 60;
        givenTime += Number(args[1][1])


        let hourOffset = oriOff - desOff;

        if (hourOffset > 0) {

            // message.channel.send(`Rewinding ${message.content.split(" ").slice(1).join(" ").split(',')[1].trim()} by **${Math.floor(hourOffset / 60) + ":" + (hourOffset % 60)}**`);

            let minutes = (hourOffset % 60) == 0 ? '00' : hourOffset % 60

            finalMessage += `${args[0]} - **${Math.floor(hourOffset / 60) + ":" + minutes}** = ${args[i]}\n${message.content.split(" ").slice(1).join(" ").split(',')[1].trim()} ${args[0]} =>`

            if (hourOffset > givenTime) {
                hourOffset -= givenTime;
                // givenTime = 720;//12*60 = 720
                givenTime = 1440 // 24 * 60 = 1,440
            }

            givenTime = givenTime - hourOffset;
        }
        else {

            hourOffset *= -1;
            let minutes = (hourOffset % 60) == 0 ? '00' : hourOffset % 60

            // message.channel.send(`Forwarding ${message.content.split(" ").slice(1).join(" ").split(',')[1].trim()} by *${Math.floor(hourOffset / 60) + ":" + (hourOffset % 60)}*`);

            finalMessage += `${args[0]} + **${Math.floor(hourOffset / 60) + ":" + minutes}** = ${args[i]}\n${message.content.split(" ").slice(1).join(" ").split(',')[1].trim()} =>`

            if ((hourOffset + givenTime) >= 1440) {

                hourOffset = hourOffset - (1440 - givenTime); // take away 60?
                givenTime = 0;

                // hourOffset = hourOffset - (720 - givenTime);
                // givenTime = 0;
            }
            givenTime = givenTime + hourOffset;
        }

        if (givenTime < 0) givenTime *= -1;
        finalMessage += ` ${Math.floor(givenTime / 60) + ":" + (givenTime % 60)} ${args[i]}\n----------------------------------\n`
        // message.channel.send(`The converted time is **${Math.floor(givenTime / 60) + ":" + (givenTime % 60)}**`);
    }


    message.channel.send(finalMessage);
    message.channel.send("Please make sure you used the correct times for Savings/Daylight time (ST vs DT)! I don't check those~");
    return 1;
}
exports.timeZone = timeZone;

/**
 * flags: none = all, 1 = self, 2 = any message without attachments
 */
async function Delete(message, params) {

    if (message.channel.type == 'dm') return -1;

    if (!message.channel.permissionsFor(message.member).has("MANAGE_MESSAGES"))
        return message.channel.send("You do not have the required permissions to delete messages in this channel! (MANAGE_MESSAGES)");

    let permission = message.channel.permissionsFor(message.guild.members.cache.get(MAIN.botID));
    if (!permission.has("MANAGE_MESSAGES"))
        return message.channel.send("I do not have the required permissions to delete messages in this channel! (MANAGE_MESSAGES)");


    let args = message.content.split(" ").slice(1).join(" ").split(',');
    let amount = args[0];
    let flag;
    if (args[1])
        if (args[1].toLowerCase().trim() == '1')
            flag = 1;
        else if (args[1].toLowerCase().trim() == '2')
            flag = 2;
        else
            return message.channel.send("If providing an optional delete modifier, it must be either `1` or `2` seperated from the number with a `,` (comma)!");

    if (params[0].length <= 0) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
    else if (isNaN(params[0])) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
    else if (params[0] > 99) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
    else if (params[0] < 1) message.channel.send("You have entered an invalid number, valid range is 0<x<100");
    else {

        amount = Number(params[0]) + 1;
        let messages = await message.channel.messages.fetch({ limit: amount });

        if (flag == 1) {

            for (let messy of messages.values()) {

                if (messy.author.id != MAIN.Client.user.id) {
                    messages.delete(messy.id)
                }
            }
            message.channel.bulkDelete(messages).catch(err => {
                console.log("Error deleting bulk messages: " + err);
                message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
            });
        }
        else if (flag == 2) {

            for (let messy of messages.values()) {
                if (messy.attachments.size != 0) {
                    messages.delete(messy.id)
                }
            }
            message.channel.bulkDelete(messages).catch(err => {
                console.log("Error deleting bulk messages: " + err);
                message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
            });
        }
        else
            message.channel.bulkDelete(messages).catch(err => {
                console.log("Error deleting bulk messages: " + err);
                message.channel.send("Some of the messages you attempted to delete are older than 14 days - aborting.");
            });

    }
}
exports.Delete = Delete;



const viewRepRolePairs = async function (message, params, user) {

    if (message.channel.type == 'dm') return message.channel.send("You can only set a rep point - role Pair from inside a server text channel");


    let guild = await MAIN.findGuild({
        id: message.guild.id
    });

    
    //guild.roles.cache.get(value).name
    guild.repRolePairs.sort((a, b) => b.rep - a.rep);
    let arr = [];

    for (let i = 0; i < guild.repRolePairs.length; i++) {

        arr.push(`${message.guild.roles.cache.get(guild.repRolePairs[i].roleID).name} - ${guild.repRolePairs[i].rep}`);
    }

    return MAIN.prettyEmbed(message, arr, {
        modifier: 'md',
        startTally: 1,
        description: "Below are all the rep-role pairs configured for this server"
    });
}
exports.viewRepRolePairs = viewRepRolePairs;