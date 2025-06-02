curl -s -S http://scorpio-provider.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities/urn:ngsi-ld:multiSensor:bme680/attrs \
 -H 'Content-Type: application/ld+json' \
 -d '{ "id": "urn:ngsi-ld:multiSensor:bme680",
 	"type": "multiSensor",
 	"Temperature": {
            "type": "Property",
            "value": {
                "@type": "celcius",
                "@value": 1234
            }
        },
        "@context": ["https://pastebin.com/raw/Mgxv2ykn"]
        }'
