import json, os, cgi, enable_cgitb

def main():
    jsonfiles = []
    for file in os.listdir(os.path.join(os.pardir, "data", "parsed-data")):
        if file.endswith(".json"):
            jsonfiles.append(file)
    jsonlist = []
    for file in jsonfiles:
        with open(os.path.join(os.pardir, "data", "parsed-data", file)) as json_file:
            jsondata = json.load(json_file)
            metadata = jsondata["Metadata"]
            jsonlist.append(metadata)
    with open(os.path.join(os.pardir, "data", "index.json"), "w") as fp:
        json.dump(jsonlist, fp, indent=4)
    if 'REQUEST_METHOD' in os.environ:
        print("Content-Type: text")
        print("")
        print("Successfully indexed metadata of json files in parsed-data directory and wrote to index.json")
    else:
        print("Successfully indexed metadata of json files in parsed-data directory and wrote to index.json")
if __name__ == "__main__":
    main()