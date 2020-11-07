const express = require('express');
const app = express();
const path = require('path');
const MAIN = require('../scraper.js');
const port = MAIN.config.dashboardPort;

var Commands = require('../commands.json');

app.set('views', __dirname + '/views');
app.set('view engine', 'pug')
app.use(express.static(`${__dirname}/assets`));
app.locals.basedir = `${__dirname}/assets`;



var checkCommandsSearchArray = Commands.reduce((accum, curr) => {
    accum.upperCase.push(curr.title.toUpperCase());
    accum.normal.push(curr.title);
    return accum;
}, { upperCase: [], normal: [] });



const initialise = async function () {

    app.listen(port, () => { console.log(`server is live on ${port}`) });

    app.get('/', function (req, res) {
        res.render('index', {
            something: "Null",
            subtitle: "Boii"
        });
        //res.send('Hello World')
    });

    //console.log(Commands)

    let subCategoryMap = new Map();
    let subCategoryArr = [];


    for (let i = 0; i < Commands.length; i++) {


        let subCategory = Commands[i].category;//Get the commands category

        for (let subSection of Commands[i].subsection) {

            let subArr = subCategoryMap.get(subCategory);//See if there is an array in the map for this subSection
            if (!subArr)
                subCategoryMap.set(subSection, [subCategory]);
            else
                if (!subArr.includes(subCategory))
                    subArr.push(subCategory);
        }


        Commands[i].subsection = Commands[i].subsection.join(' ').toLowerCase();
    }

    // console.log(Commands)

    app.get('/commands', function (req, res) {
        res.render('commands', {
            subtitle: 'Commands',
            categories: [{ name: 'Games', icon: 'fas fa-users' },
            { name: 'Music', icon: 'fas fa-music' },
            { name: 'Notifications', icon: 'fas fa-bell' },
            { name: 'Stats', icon: 'fas fa-info-circle' }],
            //commands: checkCommandsSearchArray.normal
            completeCommands: Commands,
            subSectionCategories: subCategoryMap
            //searchCommands: checkCommandsSearchArray.upperCase
        })
    });

    /*
     
    */
}
exports.initialise = initialise;