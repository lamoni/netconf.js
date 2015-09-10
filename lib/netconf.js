var Netconf = function(options) {
    /*
    * Properties
    */
    this.stream = 0;

    this.defaultOptions = {
        port: 830
    };

    /**
     * Options sanity checking
     */
    if (typeof options.host == "undefined") {
        throw "'host' is required";
    }

    if (typeof options.username == "undefined") {
        throw "must set username or publickey";
    }

    if (typeof options.password == "undefined" && typeof options.publickey == "undefined") {
        throw "must set password or publickey";
    }

    /**
     * Inject default options when necessary
     */
    for (var key in this.defaultOptions) {
        if (!options.hasOwnProperty(key) && this.defaultOptions.hasOwnProperty(key)) {
            options[key] = this.defaultOptions[key];
        }
    }

    this.options = options;
};

/**
 * Send raw RPC calls
 * @param rpc
 */
Netconf.prototype.sendRPC = function(rpc) {
    this.stream.write('<rpc>'+rpc+'</rpc>');
};

/**
 * Send operational commands (REMOVE THIS BEFORE PUSHING PUBLICLY, THIS IS JUNOS SPECIFIC)
 * @param format
 * @param command
 */
Netconf.prototype.sendOperationalCommand = function(format, command) {
    this.sendRPC('<command format="'+format+'">'+command+'</command>');
};

Netconf.prototype.sendOperationalCommandText = function(command) {
    this.sendOperationalCommand('text', command);
};

Netconf.prototype.sendOperationalCommandXML = function(command) {
    this.sendOperationalCommand('xml', command);
};

/**
 * Main starting point for Netconf.js
 * @param callback
 * @param handler
 * @returns {Netconf}
 */

Netconf.prototype.connect = function(callback, handler) {

    var self = this;
    var Connection = require('ssh2');
    var conn = new Connection();

    /**
     * @note - Possibly bug-inducing due to the possibility of option collisions between Netconf.js and
     *         ssh2 module options?  Consider splitting it out into a separate 'array'.
     */
    conn.connect(this.options);

    conn.on('ready', function () {
        conn.subsys('netconf', function (err, stream) {
            if (err) throw err;

            self.stream = stream;

            self.stream.on('close', function() {
                conn.end();
            });

            var data = "";
            self.stream.on('data', function(output) {
                data = data + output;

                if (data.toString().indexOf(']]>]]>') > -1) {
                    data = data.toString().replace(']]>]]>', '');
                    handler(data);
                }

            });

            callback();

        });
    });

    return self;
};

module.exports = Netconf;