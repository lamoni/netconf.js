var Netconf = require('../lib/netconf');

var nc = new Netconf({
    hosts: {
        '172.16.200.129': {
            username: 'lamoni',
            password: 'lamoni123',
            mode: 'multiple'
        },
        '172.16.200.131': {
            username: 'lamoni',
            password: 'lamoni123',
            mode: 'single'
        }
    }
});

nc.sendOperationalCommand('text', 'show version', function (hostname, output) {

    console.log(output);
    nc.sendOperationalCommandToSpecificHost(hostname, 'text', 'show system uptime', function (hostname, output) {
        console.log(output);
    });

});

