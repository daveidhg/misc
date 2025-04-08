import json
import logging
from flask import Flask, request, jsonify
import paho.mqtt.client as mqtt

# Configurations
MQTT_BROKER = ''  # Your MQTT broker hostname or IP
MQTT_PORT = 8883  # MQTT broker port
MQTT_TOPIC = ''  # Topic to publish to
MQTT_USERNAME = ''  # MQTT username
MQTT_PASSWORD = ''  # MQTT password

# Setup Flask app
app = Flask(__name__)

mqtt_client = mqtt.Client()

# Configure MQTT client with username/password
mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
mqtt_client.tls_set()
mqtt_client.connect(MQTT_BROKER, MQTT_PORT)

# Connect to MQTT broker
mqtt_client.loop_start()

@app.route('/notify', methods=['POST'])
def notify():
    """Handle incoming notifications from Scorpio Context Broker and publish to MQTT"""
    try:
        payload = request.get_json(force=True)

        app.logger.info(f"Received payload: {json.dumps(payload, indent=2)}")

        # Convert the payload to a string (this depends on your payload format)
        message = json.dumps(payload)

        mqtt_client.publish(MQTT_TOPIC, message, qos=0)

        return jsonify({"status": "success", "message": "Notification processed and sent to MQTT"}), 200
    except Exception as e:
        app.logger.error(f"Error processing notification: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)

    app.run(host='0.0.0.0', port=5000, debug=True)
