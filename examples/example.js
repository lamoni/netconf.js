var Netconf = require('../lib/netconf');

var nc = new Netconf({
    host: '172.16.200.129',
    username: 'root',
    password: 'root123'
});

nc.connect(
    function () {
        nc.sendOperationalCommandXML('show interfaces terse');
    },

    function(output) {
        console.log(output);
    });

