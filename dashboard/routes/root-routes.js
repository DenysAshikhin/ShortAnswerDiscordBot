const express = require('express');
const router = express.Router();


var Commands = require('../../commands.json');



router.get('/', function (req, res) {

    let loggedIn = res.locals.user ? true : false;

    console.log('in /')
    res.render('index', {
        something: "Null",
        subtitle: "Short Answer Bot Homepage",
        loggedIn: loggedIn
    });
    //res.send('Hello World')
});


let subCategoryMap = new Map();
let subCategoryArr = [];


for (let i = 0; i < Commands.length; i++) {

    Commands[i].category = Commands[i].category.split('*').join('').split('/').join('-');

    let subCategory = Commands[i].category; //Get the commands category

    for (let subSection of Commands[i].subsection) {

        let subArr = subCategoryMap.get(subSection); //See if there is an array in the map for this subSection
        if (!subArr)
            subCategoryMap.set(subSection, [subCategory]);
        else
        if (!subArr.includes(subCategory)) {
            subArr.push(subCategory);
            subArr.sort(function (a, b) {

                if (a == 'Other')
                    if (b == 'Other')
                        return 0;
                    else
                        return 1;
                if (b == 'Other')
                    return -1;

                else
                    return a.localeCompare(b);
            });
        }
    }


    Commands[i].subsection = Commands[i].subsection.join(' ').toLowerCase();
}

router.get('/commands', function (req, res) {

    res.render('commands', {
        subtitle: 'Commands',
        categories: [{
                name: 'Games',
                icon: 'fas fa-users',
                subSectionCategories: subCategoryMap.get('games'),
                exactCategory: 'games'
            },
            {
                name: 'Music',
                icon: 'fas fa-music',
                subSectionCategories: subCategoryMap.get('music'),
                exactCategory: 'music'
            },
            {
                name: 'Notifications',
                icon: 'fas fa-bell',
                subSectionCategories: subCategoryMap.get('notifications'),
                exactCategory: 'notifications'
            },
            {
                name: 'Stats',
                icon: 'fas fa-info-circle',
                subSectionCategories: subCategoryMap.get('stats'),
                exactCategory: 'stats'
            },
            {
                name: 'General',
                icon: 'fas fa-music',
                subSectionCategories: subCategoryMap.get('general'),
                exactCategory: 'general'
            },
            {
                name: 'Quality of Life',
                icon: 'fas fa-music',
                subSectionCategories: subCategoryMap.get('qof'),
                exactCategory: 'qof'
            },
            {
                name: 'Admin',
                icon: 'fas fa-music',
                subSectionCategories: subCategoryMap.get('admin'),
                exactCategory: 'admin'
            },
            {
                name: 'Bugs/Suggestions',
                icon: 'fas fa-music',
                subSectionCategories: subCategoryMap.get('bugs'),
                exactCategory: 'bugs'
            },
        ],
        //commands: checkCommandsSearchArray.normal
        completeCommands: Commands,
        subSectionCategories: subCategoryMap
        //searchCommands: checkCommandsSearchArray.upperCase
    })
});



module.exports = router;