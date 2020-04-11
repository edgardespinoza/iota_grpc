const grpc = require('grpc');
const path = require('path');
var protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = path.join(__dirname, './identity.proto');
const proxy = require('./proxy')

var packageDefinition = protoLoader.loadSync(
    PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

const identity = grpc.loadPackageDefinition(packageDefinition).iota.Identity;

class Identity {
    insert(call, callback) {
        let newIdentity = Object.assign({}, call.request);

        return callback(null, newIdentity);
    }

    getIdentity(call, callback) {

        (async function() {
            try {
                let newIdentity = Object.assign({}, call.request)
                console.log(newIdentity.root)
                let credential = await proxy.getCredential(newIdentity.root)
                return callback(null, {
                    body: credential
                });
            } catch (E) {
                console.log(E)
                return callback(null, {
                    body: "Error" + E
                });
            }

        })();
    }

    validate(call, callback) {
        (async function() {
            try {
                let validateVc = Object.assign({}, call.request)
                console.log(validateVc.body)
                console.log(validateVc.root)
                let flag = await proxy.validate(validateVc.body, validateVc.root)
                return callback(null, {
                    validate: flag
                });
            } catch (E) {
                console.log(E)
                return callback(null, {
                    validate: false
                });
            }

        })();
    }

}

const getServer = function(service, serviceCall, lintener) {
    const server = new grpc.Server();
    server.addService(service, serviceCall);
    server.bind(lintener, grpc.ServerCredentials.createInsecure());
    return server;
}

function main() {
    const identityServer = getServer(identity.service, new Identity, '0.0.0.0:50051');
    identityServer.start();
    console.log("main.star");

}

main();