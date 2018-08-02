import json, os, cgi, enable_cgitb

def main():
    form = cgi.FieldStorage()
    print("Content-type: application/json")
    print("")
    inhash = form.getvalue("hash")
    print(inhash)
    with open(os.path.join(os.pardir, "data", "hashes.json"), "r") as fp:
        hashes = json.load(fp)
    jsonName = hashes[inhash]
    with open(os.path.join(os.pardir, "data", "parsed-data", jsonName), "r") as fp:
        jsonFile = json.load(fp)
    #print("Content-type: application/json")
    #print("")
    #print(json.dumps(jsonFile))
    
if __name__ == "__main__":
    main()