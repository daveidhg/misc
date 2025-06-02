curl http://scorpio-provider.127.0.0.1.nip.io:8080/ngsi-ld/v1/subscriptions -s -S -H 'Content-Type: application/ld+json' -d '{
  "id": "urn:subscription:1",
  "type": "Subscription",
  "entities": [{
  	 "id": "urn:ngsi-ld:multiSensor:bme680",
         "type": "multiSensor"
       }],
 "notification": {
  "endpoint": {
   "uri": "mqtt://10.0.2.15:1883/multiSensor/bme680",
   "accept": "application/json"
  }
 },
 "@context": ["https://pastebin.com/raw/Mgxv2ykn"]
}'
