const grpc = require('grpc');
const path = require('path');
var protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = path.join(__dirname, './identity.proto');

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
        let newIdentity = Object.assign({}, call.request);

        return callback(null, {
            body: "hola"

        });
    }

    validate(call, callback) {
        let newIdentity = Object.assign({}, call.request);

        return callback(null, newIdentity);
    }

}

const getServer = function(service, serviceCall, lintener) {
    const server = new grpc.Server();
    server.addService(service, serviceCall);
    server.bind(lintener, grpc.ServerCredentials.createInsecure());
    return server;
}

function main() {
    const identityServer = getServer(identity.service, new Identity, 'localhost:50051');
    identityServer.start();
    console.log("main.star");

}

main();