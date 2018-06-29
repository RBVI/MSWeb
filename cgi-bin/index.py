#!/usr/local/bin/python3

import enable_cgitb
import os

def main():
    files = os.listdir(os.path.join(os.pardir, 'data'))
    print("Content-Type: text/html")
    print("")
    for file in files:
        print("<option>"+str(file)+"</option>")

if __name__ == "__main__":
    main()