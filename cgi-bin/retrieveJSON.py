#!/usr/local/bin/python3
import json, os, cgi, enable_cgitb

def main():
    form = cgi.FieldStorage()
    args = {}
    for arg in form:
        args[arg] = form.getvalue(arg)
    with open(os.path.join(os.pardir, "data", "hashes.json")) as fp:
        hashes = json.load(fp)
    jsonName = hashes[arg["hash"]]
    with open(os.path.join(os.pardir, "data", "parsed-data", jsonName)) as fp:
        jsonFile = json.load(fp)
    print("Content-Type: application/json")
    print("")
    print(json.dumps(jsonFile))
    
if __name__ == "__main__":
    main()