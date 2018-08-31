#!/usr/local/bin/python3
import json, os, cgi, enable_cgitb, hashlib
from collections import OrderedDict
def hashJSON(jsonlist):
    hashes = {}
    for json in jsonlist:
        hashes[hashlib.sha256(json.encode("utf-8")).hexdigest()] = json
    return hashes

def main():
    initUmask = os.umask(0o002)
    # -- lists json files in parsed-data directory -- 
    jsonfiles = []
    for jsonfile in os.listdir(os.path.join(os.pardir, "data", "parsed-data")):
        if jsonfile.endswith(".json"):
            jsonfiles.append(jsonfile)
    # -- hashes names of json files in parsed-data directory -- 
    hashes = hashJSON(jsonfiles)
    # -- extracts metadata from files -- 
    jsonlist = []
    for jsonfile in jsonfiles:
        with open(os.path.join(os.pardir, "data", "parsed-data", jsonfile)) as json_file:
            jsondata = json.load(json_file)
            metadata = jsondata["Metadata"]
            metadata["Hash"] = hashlib.sha256(jsonfile.encode("utf-8")).hexdigest()
            jsonlist.append(metadata)
    # -- writes json metadata and hash of file to index.json --
    with open(os.path.join(os.pardir, "data", "index.json"), "w") as fp:
        json.dump(jsonlist, fp, indent=4, sort_keys=False)
    # -- writes hashes and filenames to hashes.json -- 
    with open(os.path.join(os.pardir, "data", "hashes.json"), "w") as fp:
        json.dump(hashes, fp, indent=4, sort_keys=False)
    os.umask(initUmask)
    # -- reports end of indexing to user depending on command line or cgi --
    if 'REQUEST_METHOD' in os.environ:
        pass
    else:
        print("Successfully indexed metadata of json files in parsed-data directory and wrote to index.json")
if __name__ == "__main__":
    main()