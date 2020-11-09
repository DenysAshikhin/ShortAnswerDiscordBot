const express = require('express');
const router = express.Router();

router.get('/', function (req, res) {
    res.render('dashboard/index', {
        something: "Null",
        subtitle: "Short Answer Bot Homepage"
    });
    //res.send('Hello World')
});

module.exports = router;