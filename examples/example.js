var Netconf = require('../lib/netconf');

var nc = new Netconf({
    hosts: {
        '172.16.200.129': {
            username: 'lamoni',
            password: 'lamoni123',
            mode: 'multiple'
        }
    },
    connect: function (hostname, capabilities) {
        console.log(capabilities);
    }
});

nc.sendRPC('<command>show version</command>', function (hostname, xml) {


});
