#!/bin/bash

# Run using ". ./getDataServiceAccessToken" for the variables to be assigned in the env and available in the terminal.

export TOKEN_ENDPOINT=$(curl -s -X GET 'http://mp-data-service.127.0.0.1.nip.io:8080/.well-known/openid-configuration' | jq -r '.token_endpoint')


docker run -v $(pwd):/cert quay.io/wi_stefan/did-helper:0.1.1

export HOLDER_DID=$(cat did.json | jq '.id' -r) 


export VERIFIABLE_PRESENTATION="{
    \"@context\": [\"https://www.w3.org/2018/credentials/v1\"],
    \"type\": [\"VerifiablePresentation\"],
    \"verifiableCredential\": [
        \"${VERIFIABLE_CREDENTIAL}\"
    ],
    \"holder\": \"${HOLDER_DID}\"
  }" 

  
export JWT_HEADER=$(echo -n "{\"alg\":\"ES256\", \"typ\":\"JWT\", \"kid\":\"${HOLDER_DID}\"}"| base64 -w0 | sed s/\+/-/g | sed 's/\//_/g' | sed -E s/=+$//) 


export PAYLOAD=$(echo -n "{\"iss\": \"${HOLDER_DID}\", \"sub\": \"${HOLDER_DID}\", \"vp\": ${VERIFIABLE_PRESENTATION}}" | base64 -w0 | sed s/\+/-/g |sed 's/\//_/g' |  sed -E s/=+$//) 

  
export SIGNATURE=$(echo -n "${JWT_HEADER}.${PAYLOAD}" | openssl dgst -sha256 -binary -sign private-key.pem | base64 -w0 | sed s/\+/-/g | sed 's/\//_/g' | sed -E s/=+$//)

    
export JWT="${JWT_HEADER}.${PAYLOAD}.${SIGNATURE}" 

      
export VP_TOKEN=$(echo -n ${JWT} | base64 -w0 | sed s/\+/-/g | sed 's/\//_/g' | sed -E s/=+$//) 

        
export DATA_SERVICE_ACCESS_TOKEN=$(curl -s -X POST $TOKEN_ENDPOINT \
      --header 'Accept: */*' \
      --header 'Content-Type: application/x-www-form-urlencoded' \
      --data grant_type=vp_token \
      --data vp_token=${VP_TOKEN} \
      --data scope=default | jq '.access_token' -r ) 
echo ${DATA_SERVICE_ACCESS_TOKEN}
