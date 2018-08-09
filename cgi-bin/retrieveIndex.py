#!/usr/local/bin/python3

import json, os, cgi, enable_cgitb

def main():
    with open(os.path.join(os.pardir, "data", "index.json")) as fp:
        indexfile = json.load(fp)
    print("Content-Type: application/json")
    print("")
    print(json.dumps(indexfile))

if __name__ == "__main__":
    main()