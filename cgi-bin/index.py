#!/usr/local/bin/python3

import enable_cgitb
import os

def main():
    files = []
    for file in os.listdir(os.path.join(os.pardir, 'data')):
        if file.endswith(".txt"):
            files.append(file)
    print("Content-Type: text/html")
    print("")
    if not files:
        print("<option>No files in data directory!</option>")
    else:
        for file in files:
            print("<option>"+str(file)+"</option>")
if __name__ == "__main__":
    main()