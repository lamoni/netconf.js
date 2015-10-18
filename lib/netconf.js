var ssh2 = require('ssh2');
var xml2js = require('xml2js');
/**
 * Should probably abstract this out so the dev can feed in custom xml2js parser options...
 */

var parser = new xml2js.Parser({trim: true, explicitArray: false});

var Netconf = function(options) {
    /*
    * Properties
    */
    this.hostsConfigurations = [];

    this.hostsConnections = [];

    this.serverCapabilities = [];

    this.serverID = 0;

    this.defaultOptions = {
        port: 830,
        mode: 'single'
        /**
         'single' means the blocking occurs at the connection level,
         'multiple' means the blocking occurs at the command level
        **/
    };

    /**
     * Options sanity checking
     */
    if (typeof options.hosts == "undefined") {
        throw "'hosts' object is required";
    }

    /**
     * Reformat options object into an object acceptable by ssh2 module
     */
    for (var hostname in options.hosts) {
        if (options.hosts.hasOwnProperty(hostname)) {
            var host = options.hosts[hostname];
            var configOptions = {host: hostname};

            for (var attr in host) {
                configOptions[attr] = host[attr];
            }

            /**
             * Inject default options when necessary
             */
            for (var key in this.defaultOptions) {
                if (!configOptions.hasOwnProperty(key) && this.defaultOptions.hasOwnProperty(key)) {
                    configOptions[key] = this.defaultOptions[key];
                }
            }

            this.hostsConfigurations[hostname] = configOptions;

        }

    }

    return this;
};


/**
 * Getter for the capabilities sent by server
 */
Netconf.prototype.getServerCapabilities = function() {

    return this.serverCapabilities;

};

/**
 * Returns boolean dependant on if server supports the given capability (e.g. urn:ietf:params:xml:ns:netconf:base:1.0)
 * @param name
 */
Netconf.prototype.doesServerSupportCapability = function(name) {

    if (this.getServerCapabilities().indexOf(name) > -1) {

        return true;

    }

    return false;

};

/**
 * Send operational commands (REMOVE THIS BEFORE PUSHING PUBLICLY, THIS IS JUNOS SPECIFIC)
 * @param format
 * @param command
 */
Netconf.prototype.sendOperationalCommand = function(format, command, handler) {

    this.sendRPC('<command format="'+format+'">'+command+'</command>', handler);

};

Netconf.prototype.sendOperationalCommandToSpecificHost = function(hostname, format, command, handler) {

    this.sendRPCToSpecificHost(hostname, '<command format="'+format+'">'+command+'</command>', handler);

};

/**
 * Parses the Hello we receive from the server.  Basically just saving the session ID and capabilities
 * @param xml
 */
Netconf.prototype.parseHello = function (xml) {

    if (xml['hello'].hasOwnProperty('session-id')) {

        this.sessionID = xml['hello']['session-id'];

    }

    if (xml['hello'].hasOwnProperty('capabilities') &&
        xml['hello']['capabilities'].hasOwnProperty('capability')) {

        this.serverCapabilities = xml['hello']['capabilities']['capability'];

    }

};

/**
 * Send an RPC call to a specific host
 * @param hostname
 * @param rpc
 * @param handler
 */
Netconf.prototype.sendRPCToSpecificHost = function(hostname, rpc, handler) {

    rpc = '<rpc>' + rpc + '</rpc>';

    var self = this;

    var configOptions = this.hostsConfigurations[hostname];

    if (!(hostname in self.hostsConnections && configOptions.mode === 'single')) {

        var conn = new ssh2();
        conn.connect(configOptions);

        conn.on('ready', function () {
            conn.subsys('netconf', function (err, stream) {
                var data = "";
                stream.on('data', function (output) {
                    data = data + output;

                    if (data.toString().indexOf(']]>]]>') > -1) {

                        data = data.toString().replace(']]>]]>', '');

                        if (data.indexOf('</hello>') > -1) {

                            /**
                             * Parse out capabilities
                             */
                            parser.parseString(data, function (err, result) {

                                self.parseHello(result);

                                console.log(self.serverCapabilities);
                                data = "";

                            });

                        }
                        else {
                            stream.removeAllListeners('data');

                            parser.parseString(data, function (err, result) {

                                handler(hostname, result['rpc-reply']);

                            });

                        }

                    }

                });

                stream.write(rpc);

                self.hostsConnections[configOptions['host']] = stream;

            });

        });

    }
    else {

        var stream = self.hostsConnections[hostname];

        var data = "";

        var dataCallback = function (output) {

            data = data + output;

            if (data.toString().indexOf(']]>]]>') > -1) {

                data = data.toString().replace(']]>]]>', '');

                if (data.indexOf('</hello>') > -1) {

                    data = "";

                }
                else {

                    stream.removeListener('data', dataCallback);

                    parser.parseString(data, function (err, result) {

                        handler(hostname, result['rpc-reply']);

                    });

                }

            }

        };

        stream.removeListener('data', dataCallback).on('data', dataCallback);

        stream.write(rpc);

        self.hostsConnections[hostname] = stream;

    }
};

/**
 * Send RPC calls to all hosts currently "configured" for this instance of Netconf.js (a wrapper non-blocking loop
 * for sendRPCToSpecificHost)
 * @param rpc
 */
Netconf.prototype.sendRPC = function(rpc, handler) {

    var self = this;

    for (var configOptions in this.hostsConfigurations) {

        self.sendRPCToSpecificHost(configOptions, rpc, handler);

    }

};

module.exports = Netconf;