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
                sensor_time = payload['ts']
            else:
                if 'body' in payload:
                    sensor_time = payload['body']['data'][0]['Timestamp']['value']['@value'] 
                else:
                    sensor_time = payload['data'][0]['Timestamp']['value']['@value']
                
            data[topic].append((sensor_time, timestamp))
    
    return data

def calculate_delays(data):
    delays = []
    
    assert len(data) == 2, "Error: Expected exactly two topics."
    
    topic1, topic2 = data.keys()
    topic2_ptr = 0
    failed = 0
    for sensor_time1, timestamp1 in data[topic1]:
        sensor_time2, timestamp2 = data[topic2][topic2_ptr]
        if sensor_time1 == sensor_time2:
            delays.append((sensor_time1, timestamp2 - timestamp1))
            topic2_ptr += 1
            if topic2_ptr == len(data[topic2]):
                break
        else:
            failed += 1
    return delays, failed, len(data[topic1]) # total messages originally sent

def print_info(delays, failed, total, file):
    assert delays, "Error: No delays found."
    print(f"Average delay for {file}: {sum(delay for _, delay in delays) * 1000 / len(delays):.3f} ms")
    if failed:
        print(f"Failed to match {failed}/{total} messages.")
    with open("output/" + file, "w") as f:
        csv_writer = csv.writer(f)
        csv_writer.writerows([[round(delay * 1000, 3), _] for _, delay in delays])


def main():
    test_env = ("local", "remote", "ife") 
    categories = ("noauth", "manualauth", "autoauth")
    for env in test_env:
        for cat in categories:
            file = f"{env}_{cat}.csv"
            data = parse_csv("recordings/" + file)
            delays, failed, total = calculate_delays(data)
            print_info(delays, failed, total, file)

if __name__ == "__main__":
    main()
