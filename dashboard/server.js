const express = require('express');
const app = express();

const MAIN = require('../scraper.js');



const port = MAIN.config.dashboardPort;


app.set('views', __dirname + '/views');
app.set('view engine', 'pug')

const initialise = async function(){

    //app.listen(port, () => {console.log(`server is live on ${port}`)});



    app.get('/', function (req, res) {
        
        res.render('index', {
            something: "Null",
            subtitle: "Boii"
        })
        //res.send('Hello World')
      })
}
exports.initialise = initialise;