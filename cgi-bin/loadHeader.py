#!/usr/local/bin/python3

import enable_cgitb
import os

def main():
    import cgi
    form = cgi.FieldStorage()
    if "data" in form:
        if form.getvalue("data") in os.listdir(os.path.join(os.pardir, 'data')):
            inputfile = open(os.path.join(os.pardir, 'data', form.getvalue("data")), 'r')
            for x in range(3):
                inputfile.readline()
            header = inputfile.readline().split("\t")
            header[0] = "Data #"
            print("Content-Type: text")
            print("")
            print("|".join(header))
        else:
            print("Content-Type: text")
            print("")
            print("Incorrect data selection, try another data set.")
    else:
        print("Content-Type: text")
        print("")
        print("Incorrect data selection, try another data set.")
if __name__ == "__main__":
    main()