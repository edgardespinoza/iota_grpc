from __future__ import print_function
import logging

import grpc

import identity_pb2
import identity_pb2_grpc
metadata = []

def run():
    # NOTE(gRPC Python Team): .close() is possible on a channel and should be
    # used in circumstances in which the with statement does not fit the needs
    # of the code.
    metadata.append(('x-api-key', 'AIzaSyAAXVqinGm4bYk0wIudoaURLwafbaQu6P0'))

    with grpc.insecure_channel('0.0.0.0:50051') as channel: #35.193.13.197:80
        stub = identity_pb2_grpc.IdentityStub(channel)
        rootdata ='IRPAMDDTQFAIAEWGHTXECRBOWSNBPBKBLVZJWCVALXNURNXZSXQUFAROMFIUEZOQBLPISNEAQEMYFQWTH'

        vc = '{"@context":["https://w3.org/2018/credentials/v1","https://schema.org/Person"],"type":["VerifiableCredential","PersonCredential"],"issuer":"did:iota:2ne4dVduP4zpX7ZkN53UQ6c2ojEGrWDoXs7","issuanceDate":"2020-02-23T16:41:07.164Z","credentialSubject":{"familyName":"tupinio trauco","legalName":"betsabe","email":"edgard.espinoza.rivas@gmail.com","telephone":"994001406","taxID":"40063820","id":"did:dni:5rViTkGThJCoffoMX"},"proof":{"type":"ES256K","created":"2020-02-23T16:41:07.169Z","proofPurpose":"assertionMethod","verificationMethod":"c1a85a3280a4e862dfde563aab5f6cddd6725a8bc9a48e8b29285bd4f413861766d8bf48b97ccc280fa06ce8e4830c846543f0a8c5922c91e049f6097eed356a","jws":"eyJhbGciOiJFUzI1NksifQ..IxOORZrvLQax0IbFungWvN_2bU3ntZNk8vuThYZ_mdb2AWdlQafe8CoEKBwZxhxYsuPu_Ffz7FKwMOP4iXSdPg"}}'
        
        #response = stub.getIdentity(identity_pb2.IdentityIdOnly(root=rootdata), metadata=metadata)
        
        response = stub.validate(identity_pb2.IdentityRoot(body=vc,root=rootdata), metadata=metadata)


    print('Get by id 1:')
    print(response)

if __name__ == '__main__':
   # logging.basicConfig()
    run()