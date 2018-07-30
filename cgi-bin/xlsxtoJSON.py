#!/usr/local/bin/python3
import json, os, sys, cgi
import openpyxl as pyxl

def getArgs(argv):
    args = {}
    while argv:
        if argv[0][0] == "-":
            args[argv[0]] = argv[1]
        argv = argv[1:]
    return args

def main():
    types = []
    if 'REQUEST_METHOD' in os.environ:
        #running as cgi
        import enable_cgitb
        form = cgi.FieldStorage()
    else:
        #running locally
        args = getArgs(sys.argv)
        if '-i' in args and '-t' in args:
            wb = pyxl.load_workbook(os.path.join(os.pardir, 'data', args["-i"]))
            ws = wb.active
            if args["-t"] == "1":
                data = {}
                sheet1 = 2
        else:
            print("No input file specified with '-i' or no type specified with '-t'.")

if __name__ == "__main__":
    main()