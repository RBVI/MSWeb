#!/usr/local/bin/python3
import json, os, cgi, enable_cgitb, zipfile, sys
from io import BytesIO

def main():
    form = cgi.FieldStorage()
    args = {}
    for arg in form:
        args[arg] = form.getvalue(arg)
    with open(os.path.join(os.pardir, "data", "hashes.json")) as fp:
        hashes = json.load(fp)
    if isinstance(args["hash"], list):
        downloads = []
        rawDownloads = []
        for item in args["hash"]:
            downloads.append(hashes[item])
        for download in downloads:
            for item in os.listdir(os.path.join(os.pardir, "data", "raw-data")):
                if os.path.splitext(item)[0].lower() == os.path.splitext(download)[0].lower():
                    rawDownloads.append(item)
        tmpZip = BytesIO()
        with zipfile.ZipFile(tmpZip, "w", zipfile.ZIP_DEFLATED) as outZip:
            for filename in rawDownloads:
                outZip.write(os.path.join(os.pardir, "data", "raw-data", filename), filename)
        sys.stdout.write("Content-Type: application/octet-stream\r\n")
        sys.stdout.write('Content-Disposition: attachment; filename="dataDownloads.zip" \r\n\r\n')
        sys.stdout.flush()
        sys.stdout.buffer.write(tmpZip.getvalue())
    else:
        jsonName = hashes[args["hash"]]
        for item in os.listdir(os.path.join(os.pardir,"data","raw-data")):
            if os.path.splitext(item)[0].lower() == os.path.splitext(jsonName)[0].lower():
                rawName = item
        tmpZip = BytesIO()
        with zipfile.ZipFile(tmpZip, "w", zipfile.ZIP_DEFLATED) as outZip:
            outZip.write(os.path.join(os.pardir, "data", "raw-data", rawName), rawName)
        sys.stdout.write("Content-Type: application/octet-stream\r\n")
        sys.stdout.write('Content-Disposition: attachment; filename="' + os.path.splitext(rawName)[0] + '.zip"\r\n\r\n')
        sys.stdout.flush()
        sys.stdout.buffer.write(tmpZip.getvalue())

if __name__ == "__main__":
    main()