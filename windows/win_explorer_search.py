import re
import os

# Windows explorer search is slow and inaccurate, this is a quick and easy way to search for files in a folder.

folder_path = "{path to folder}"

while True:
    pattern = input("Enter the search string: ")
    matched_files = []
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if re.search(pattern, file):
                matched_files.append(os.path.join(root, file))

    print("Matched files:")
    for file in matched_files:
        print(file)