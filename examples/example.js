var Netconf = require('../lib/netconf');

var nc = new Netconf('localhost', {});

console.log(nc.connect());