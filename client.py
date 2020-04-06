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

    with grpc.insecure_channel('35.193.13.197:80') as channel:
        stub = identity_pb2_grpc.IdentityStub(channel)
        response = stub.getIdentity(identity_pb2.IdentityIdOnly(root='1'), metadata=metadata)
    print('Get by id 1:')
    print(response)

if __name__ == '__main__':
   # logging.basicConfig()
    run()