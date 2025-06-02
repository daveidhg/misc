curl http://scorpio-provider.127.0.0.1.nip.io:8080/ngsi-ld/v1/entities -H 'Accept: application/json' -H 'Content-Type: application/json' \
-d '{"id": "urn:ngsi-ld:multiSensor:bme680",
        "type": "multiSensor",
        "Air Quality": {
            "type": "Property",
            "value": {
                "@type": "VOC",
                "@value": 0
            }
        },
        "Gas Resistance": {
            "type": "Property",
            "value": {
                "@type": "ohms",
                "@value": 798674
            }
        },
        "Humidity": {
            "type": "Property",
            "value": {
                "@type": "r.H.",
                "@value": 40.6
            }
        },
        "Index for Air Quality": {
            "type": "Property",
            "value": {
                "@type": "calculated index",
                "@value": 109
            }
        },
        "Pressure": {
            "type": "Property",
            "value": {
                "@type": "hPa",
                "@value": 1017.2
            }
        },
        "Relative Humidity": {
            "type": "Property",
            "value": {
                "@type": "r.H.",
                "@value": 33.49
            }
        },
        "Raw Temperature": {
            "type": "Property",
            "value": {
                "@type": "celcius",
                "@value": 24.45
            }
        },
        "Temperature": {
            "type": "Property",
            "value": {
                "@type": "celcius",
                "@value": 21.3
            }
        },
        "Timestamp": {
            "type": "Property",
            "value": {
                "@type": "ISO 8601",
                "@value": "2023-06-08T11:40:10.030Z"
            }
        }
    }'
