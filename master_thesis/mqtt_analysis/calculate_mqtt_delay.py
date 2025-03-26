import csv
import json
from collections import defaultdict


def parse_csv(file_path):
    data = defaultdict(list)
    
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        for row in reader:
            topic = row[0]
            payload = json.loads(row[1])
            timestamp = float(row[4])  # Epoch timestamp from CSV
            
            if 'ts' in payload:
                sensor_time = payload['ts']  # For i/bme680
            else:
                sensor_time = payload['body']['data'][0]['Timestamp']['value']['@value']  # For multiSensor/temperature
                
            data[topic].append((sensor_time, timestamp))
    
    return data

def calculate_delays(data):
    delays = []
    
    assert len(data) == 2, "Error: Expected exactly two topics."
    
    topic1, topic2 = data.keys()
    topic2_ptr = 0
    for sensor_time1, timestamp1 in data[topic1]:
        sensor_time2, timestamp2 = data[topic2][topic2_ptr]
        if sensor_time1 == sensor_time2:
            delays.append((sensor_time1, timestamp2 - timestamp1))
            topic2_ptr += 1
            if topic2_ptr == len(data[topic2]):
                break
    return delays

def print_info(delays, file):
    assert delays, "Error: No delays found."
    print(f"Average delay for {file}: {sum(delay for _, delay in delays) / len(delays):.6f}")

def main():
    file_path = ("baseline.csv", "manual_auth_token.csv", "auto_auth_token.csv") 
    for (file) in file_path:
        data = parse_csv(file)
        delays = calculate_delays(data)
        print_info(delays, file)

if __name__ == "__main__":
    main()
