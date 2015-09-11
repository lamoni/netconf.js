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

nc.sendOperationalCommand('xml', 'show version', function (hostname, xml) {

    console.log(xml);

    nc.sendOperationalCommandToSpecificHost(hostname, 'text', 'show interfaces terse', function (hostname, xml) {
       console.log(xml);
    });

});

