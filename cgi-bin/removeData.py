#!/usr/local/bin/python3
import os, sys
from indexJSON import hashJSON
from indexJSON import main as jsonIndex
def getArgs(argv):
    args = {}
    while argv:
        if argv[0][0] == "-":
            args[argv[0]] = argv[1]
        argv = argv[1:]
    return args
def main():
    args = getArgs(sys.argv)
    rawFile = "nofile"
    parsedFile = "nofile"
    if "-i" in args:
        for item in os.listdir(os.path.join(os.pardir, "data", "raw-data")):
            if args["-i"] == os.path.splitext(item)[0]:
                rawFile = item
        for item in os.listdir(os.path.join(os.pardir, "data", "parsed-data")):
            if args["-i"] == os.path.splitext(item)[0]:
                parsedFile = item
        if os.path.exists(os.path.join(os.pardir, "data", "raw-data", rawFile)):
            if os.path.exists(os.path.join(os.pardir, "data", "parsed-data", parsedFile)):
                os.remove(os.path.join(os.pardir, "data", "raw-data", rawFile))
                print("Successfully removed " + rawFile + " from data/raw-data")
                os.remove(os.path.join(os.pardir, "data", "parsed-data", parsedFile))
                print("Successfully removed " + parsedFile + " from data/parsed-data")
                jsonIndex()
            else:
                print("Specified dataset does not exist in parsed-data. Check spelling and try again.")
        else:
            print("Specified dataset does not exist in raw-data. Check spelling and try again.")
    else:
        print("No dataset specified with '-i'. Specify a dataset to remove and try again.")

if __name__ == "__main__":
    main()