function Netconf(host, options) {
    this.sshClient = require("ssh2").Client;
    this.host = host;
    this.options = options;
}

Netconf.prototype.connect = function() {

};

module.exports = Netconf;