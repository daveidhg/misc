#!/bin/bash

# Run using ". ./getVerifiableCredential.sh" for the variables to be assigned in the env and available in the terminal.

export ACCESS_TOKEN=$(curl -s -X POST http://keycloak-consumer.127.0.0.1.nip.io:8080/realms/test-realm/protocol/openid-connect/token \
      --header 'Accept: */*' \
      --header 'Content-Type: application/x-www-form-urlencoded' \
      --data grant_type=password \
      --data client_id=admin-cli \
      --data username=test-user \
      --data password=test | jq '.access_token' -r)
      

export OFFER_URI=$(curl -s -X GET 'http://keycloak-consumer.127.0.0.1.nip.io:8080/realms/test-realm/protocol/oid4vc/credential-offer-uri?credential_configuration_id=user-credential' \
      --header "Authorization: Bearer ${ACCESS_TOKEN}" | jq '"\(.issuer)\(.nonce)"' -r)
      

export PRE_AUTHORIZED_CODE=$(curl -s -X GET ${OFFER_URI} \
            --header "Authorization: Bearer ${ACCESS_TOKEN}" | jq '.grants."urn:ietf:params:oauth:grant-type:pre-authorized_code"."pre-authorized_code"' -r)
            
            
export CREDENTIAL_ACCESS_TOKEN=$(curl -s -X POST http://keycloak-consumer.127.0.0.1.nip.io:8080/realms/test-realm/protocol/openid-connect/token \
      --header 'Accept: */*' \
      --header 'Content-Type: application/x-www-form-urlencoded' \
      --data grant_type=urn:ietf:params:oauth:grant-type:pre-authorized_code \
      --data pre-authorized_code=${PRE_AUTHORIZED_CODE} | jq '.access_token' -r)
      
      
export VERIFIABLE_CREDENTIAL=$(curl -s -X POST http://keycloak-consumer.127.0.0.1.nip.io:8080/realms/test-realm/protocol/oid4vc/credential \
      --header 'Accept: */*' \
      --header 'Content-Type: application/json' \
      --header "Authorization: Bearer ${CREDENTIAL_ACCESS_TOKEN}" \
      --data '{"credential_identifier":"user-credential", "format":"jwt_vc"}' | jq '.credential' -r)
echo ${VERIFIABLE_CREDENTIAL}
