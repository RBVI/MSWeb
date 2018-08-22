#!/usr/local/bin/python3
import json, os, sys, cgi, datetime, enable_cgitb
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
    if "REQUEST_METHOD" in os.environ:
        #running as cgi
        form = cgi.FieldStorage()
        args = {}
        for arg in form:
            args[arg] = form.getvalue(arg)
        infile = form['uploadfile'].file
        with open(os.path.join(os.pardir, 'data', 'raw-data', form["uploadfile"].filename), 'wb') as fp:
            fp.write(infile.read())
        lines = []
        with open(os.path.join(os.pardir, 'data', 'raw-data', form['uploadfile'].filename), 'r') as fp:
            lines = fp.readlines()
        lines = lines[3:]
        data_parsed = [] 
        for line in lines:
            line_stripped = line.rstrip()
            data_parsed.append(line_stripped.split("\t"))
        data_parsed[0][0] = "Data #"
        data_parsed = data_parsed[:20] #debug, limits to 20 data points
        data_transpose = list(zip(*data_parsed))
        data = {}
        for item in data_transpose:
            data[item[0]] = item[1:]
        metadata = {}
        metadata["Title"] = args["uploadtitle"]
        metadata["Researcher"] = args["uploadresearcher"]
        metadata["Upload"] = ["Anonymous", datetime.datetime.today().strftime('%Y-%m-%d')] #handles username of uploader later, right now enter 'Anonymous'
        metadata["Experiment"] = [args["uploadexperimentdate"], args["uploadexperimenttype"], args["uploadexperimentcond"]]
        with open(os.path.join(os.pardir, "data", "parsed-data", os.path.splitext(form["uploadfile"].filename)[0]+".json"), 'w') as fp:
            json.dump({"Metadata":metadata, "Data":data}, fp, indent=4)
        jsonIndex()
    else:
        #running locally
        args = getArgs(sys.argv)
        if "-i" in args:
            infile = open(os.path.join(os.pardir, 'data', 'raw-data', args["-i"]), "r")
            # -- parsing of data begins -- 
            lines = infile.readlines()
            lines = lines[3:]
            data_parsed = []
            for line in lines:
                line_stripped = line.rstrip()
                data_parsed.append(line_stripped.split("\t"))
            data_parsed[0][0] = "Data #"
            data_parsed = data_parsed[:20] #debug, limits to 20 data points
            data_transpose = list(zip(*data_parsed))
            data = {}
            for item in data_transpose:
                data[item[0]] = item[1:]
            # -- declaration of metadata begins -- 
            metadata = {}
            metadata["Title"] = input("Enter data title: ")
            metadata["Researcher"] = input("Enter researcher name: ")
            uploadby = input("Enter name of uploader: ")
            uploadon = datetime.datetime.today().strftime('%Y-%m-%d')
            metadata["Upload"] = [uploadby, uploadon]
            expdate = input("Enter experiment date in YYYY-MM-DD format: ")
            exptype = input("Enter experiment type: ")
            expcond = input("Enter experiment conditions: ")
            metadata["Experiment"] = [expdate, exptype, expcond]
            # -- dumps metadata and data to json file in parsed-data directory -- 
            outfile = os.path.splitext(infile.name)[0].split("/")
            outfile[2] = "parsed-data"
            with open("/".join(outfile)+".json", "w") as fp:
                json.dump({"Metadata":metadata, "Data":data}, fp, indent=4)
            jsonIndex()
        else:
            print("No input file specified with '-i'. Specify an input file and try again.")

if __name__ == "__main__":
    main()