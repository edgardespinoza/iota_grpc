Python
sudo python3 -m pip install grpcio
sudo python3 -m pip install grpcio-tools


python3 -m grpc_tools.protoc -I./  --python_out=. --grpc_python_out=. ./identity.proto


//ingresar 
gcloud compute ssh instance-identity

// crear *.pb
protoc   --include_imports   --include_source_info   ./identity.proto  --descriptor_set_out api.pb


// crear project gcloud
gcloud projects create identitygrpc
    gcloud projects delete "name"
gcloud endpoints services delete identity.endpoints.identitygrpc.cloud.goog


// set project
gcloud config set project identitygrpc

//deploy service
gcloud endpoints services deploy api.pb api_config.yaml

gcloud services enable servicecontrol.googleapis.com
gcloud services enable endpoints.googleapis.com

//zone
gcloud compute zones list
gcloud compute project-info describe --project identitygrpc
gcloud config set compute/zone us-central1-a	
gcloud config list compute/region


docker 
 sudo apt install docker-ce

// 
sudo docker run --detach --name=iota gcr.io/identitygrpc/endpoints-identity:1.0


sudo docker run \
    --detach \
    --name=esp \
    --publish=80:9000 \
    --link=iota:iota \
    gcr.io/endpoints-release/endpoints-runtime:1 \
    --service=identity.endpoints.identitygrpc.cloud.goog\
    --rollout_strategy=managed \
    --http2_port=9000 \
    --backend=grpc://iota:50051


docker build -t gcr.io/identitygrpc/endpoints-identity:1.0 .
gcloud docker -- push gcr.io/identitygrpc/endpoints-identity:1.0

gcloud compute instances list
