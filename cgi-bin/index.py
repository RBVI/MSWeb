#!/usr/local/bin/python3

import enable_cgitb
import os

def main():
    files = []
    for file in os.listdir(os.path.join(os.pardir, 'data')):
        if file.endswith(".txt"):
            files.append(file)
    print("Content-Type: text")
    print("")
    if not files:
        print("No files in data directory!")
    else:
        print("|".join(files))
if __name__ == "__main__":
    main()