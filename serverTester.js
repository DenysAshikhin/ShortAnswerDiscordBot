const net = require('net');

var socky = new net.Socket();

socky.connect('34239', '45.63.17.228', () => { socky.write("The Last Spark,na") });
socky.on('data', (data) => { console.log(JSON.parse(data.toString())) })