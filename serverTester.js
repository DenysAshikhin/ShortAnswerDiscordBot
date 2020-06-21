const net = require('net');

var socky = new net.Socket();

socky.connect(33177, '45.63.17.228', () => { socky.write("The Last Spark") });
socky.on('data', (data) => { console.log(data.toString()) })