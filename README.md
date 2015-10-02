# netconf.js
A NETCONF implementation for Node.js



Targeted RFCs
-------------
 - RFC6241 - Network Configuration Protocol (NETCONF) - https://tools.ietf.org/html/rfc6241
 - RFC6242 - Using the NETCONF Protocol over Secure Shell (SSH) - https://tools.ietf.org/html/rfc6242

Dependencies
-------------
 - ssh2 (https://github.com/mscdex/ssh2)
 - xml2js (https://github.com/Leonidas-from-XIV/node-xml2js)
 
 
Installation
------------
```
npm install (from wherever package.json is located)
```

Example
-------
```
var Netconf = require('netconf');

var nc = new Netconf({
    hosts: {
        '172.16.200.129': {
            username: 'lamoni',
            password: 'lamoni123',
            mode: 'multiple'
        },
        '172.16.200.131': {
            username: 'root',
            password: 'root123',
            mode: 'single'
        }
    }
});

// Single command

nc.sendOperationalCommandToSpecificHost(hostname, 'text', 'show interfaces terse', function (hostname, xml) {

   console.log(xml);
   
});

    
// Chained commands
nc.sendOperationalCommand('xml', 'show version', function (hostname, xml) {

    console.log(xml);

    nc.sendOperationalCommandToSpecificHost(hostname, 'text', 'show interfaces terse', function (hostname, xml) {
    
       console.log(xml);
       
    });

});
```
