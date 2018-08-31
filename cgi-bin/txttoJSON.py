#!/usr/local/bin/python3
import json, os, sys, cgi, datetime, enable_cgitb
from indexJSON import hashJSON
from indexJSON import main as jsonIndex
from collections import OrderedDict
def getArgs(argv):
    args = {}
    while argv:
        if argv[0][0] == "-":
            args[argv[0]] = argv[1]
        argv = argv[1:]
    return args
def returnSuccess(metadata, form):
    print("Content-Type: text/html")
    print("")
    print("<!DOCTYPE html>")
    print("<html>")
    print("<head>")
    print("<style>")
    print("p { margin:5px;padding:none; }")
    print("</style>")
    print("<title>Upload Successful</title>")
    print("</head>")
    print("<body>")
    print("<h1>Upload Successful</h1>")
    print("<p>Successfully uploaded " + form["uploadfile"].filename + ".")
    print("<p>Title: " + metadata["Title"] + "</p>")
    print("<p>Researcher: " + metadata["Researcher"] + "</p>")
    print("<p>Uploaded By: " + metadata["Upload"][0] + "</p>")
    print("<p>Uploaded On: " + metadata["Upload"][1] + "</p>")
    print("<p>Experiment Date: " + metadata["Experiment"][0] + "</p>")
    print("<p>Experiment Type: " + metadata["Experiment"][1] + "</p>")
    print("<p>Experiment Conditions: " + metadata["Experiment"][2] + "</p>")
    print("</body>")
    print("</html>")

def returnFail(exception):
    reporter = "[PLACEHOLDER]"
    if exception == "syntax":
        print("Content-Type: text/html")
        print("")
        print("<!DOCTYPE html>")
        print("<html>")
        print("<head>")
        print("<title>Error</title>")
        print("</head>")
        print("<h1>Syntax Error</h1>")
        print("<p>The uploader script has thrown a syntax error.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
        print("</body>")
        print("</html>")
    elif exception == "fileexists":
        print("Content-Type: text/html")
        print("")
        print("<!DOCTYPE html>")
        print("<html>")
        print("<head>")
        print("<title>Error</title>")
        print("</head>")
        print("<h1>Error (File exists)</h1>")
        print("<p>Either the file being uploaded or the parsed version already exist on the server.</p>")
        print("<p>Check list of datasets for existing file and if this error has been thrown incorrectly, please report error and conditions to "+reporter+"</p>")
        print("</body>")
        print("</html>")
    elif exception == "permission":
        print("Content-Type: text/html")
        print("")
        print("<!DOCTYPE html>")
        print("<html>")
        print("<head>")
        print("<title>Error</title>")
        print("</head>")
        print("<h1>Permission Error</h1>")
        print("<p>A permission error has been thrown.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
        print("</body>")
        print("</html>")
    else:
        print("Content-Type: text/html")
        print("")
        print("<!DOCTYPE html>")
        print("<html>")
        print("<head>")
        print("<title>Error</title>")
        print("</head>")
        print("<h1>Error</h1>")
        print("<p>An unknown error has occurred in the uploader script.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
        print("</body>")
        print("</html>")

def main():
    if "REQUEST_METHOD" in os.environ:
        #running as cgi
        form = cgi.FieldStorage()
        args = {}
        for arg in form:
            args[arg] = form.getvalue(arg)
        infile = form['uploadfile'].file
        if not os.path.exists(os.path.join(os.pardir, "data", "raw-data", form["uploadfile"].filename)):
            try:
                initUmask = os.umask(0o002)
                with open(os.path.join(os.pardir, 'data', 'raw-data', form["uploadfile"].filename), 'wb') as fp:
                    fp.write(infile.read())
                lines = []
                with open(os.path.join(os.pardir, 'data', 'raw-data', form['uploadfile'].filename), 'r') as fp:
                    lines = fp.readlines()
                for line in lines:
                        splitline = line.split("\t")
                        if splitline[0] == "" or splitline[0].isspace() or splitline[1] == "Search Name:" or splitline[0] == "1":
                            lines = lines[1:]
                data_parsed = [] 
                for line in lines:
                    line_stripped = line.rstrip()
                    data_parsed.append(line_stripped.split("\t"))
                data_parsed[0][0] = "Data #"
                #data_parsed = data_parsed[:20] #debug, limits to 20 data points
                data_transpose = list(zip(*data_parsed))
                data = OrderedDict()
                for item in data_transpose:
                    data[item[0]] = item[1:]
                metadata = OrderedDict()
                metadata["Title"] = args["uploadtitle"]
                metadata["Researcher"] = args["uploadresearcher"]
                metadata["Uploaded By"] = "Anonymous" #handles username of uploader later, right now enter 'Anonymous'
                metadata["Uploaded On"] = datetime.datetime.today().strftime('%Y-%m-%d')
                metadata["Experiment Date"] = args["uploadexperimentdate"]
                metadata["Experiment Type"] = args["uploadexperimenttype"]
                metadata["Experiment Conditions"] = args["uploadexperimentcond"]
                if not os.path.exists(os.path.join(os.pardir, "data", "parsed-data", os.path.splitext(form["uploadfile"].filename)[0]+".json")):
                    with open(os.path.join(os.pardir, "data", "parsed-data", os.path.splitext(form["uploadfile"].filename)[0]+".json"), 'w') as fp:
                        output = OrderedDict()
                        output["Metadata"] = metadata
                        output["Data"] = data
                        json.dump(output, fp, indent=4, sort_keys=False)
                    os.umask(initUmask)
                    jsonIndex() #reindexes index.json and hashes.json
                    returnSuccess(metadata, form) #returns success html page
                else:
                    os.umask(initUmask)
                    returnFail("fileexists")
            except PermissionError as e:
                #returnFail("permission")
                print("Content-Type: text")
                print("")
                print(e)
            except SyntaxError:
                returnFail("syntax")
            except NameError:
                returnFail("syntax")
        else:
            returnFail("fileexists")
    else:
        #running locally
        args = getArgs(sys.argv)
        if "-i" in args:
            with open(os.path.join(os.pardir, 'data', 'raw-data', args["-i"]), "r") as fp:
                lines = fp.readlines()
                infilename = fp.name
            # -- parsing of data begins -- 
            for line in lines:
                splitline = line.split("\t")
                if splitline[0] == "" or splitline[0].isspace() or splitline[1] == "Search Name:" or splitline[0] == "1":
                    lines = lines[1:]
            data_parsed = []
            for line in lines:
                line_stripped = line.rstrip()
                data_parsed.append(line_stripped.split("\t"))
            data_parsed[0][0] = "Data #"
            #data_parsed = data_parsed[:20] #debug, limits to 20 data points
            data_transpose = list(zip(*data_parsed))
            data = OrderedDict()
            for item in data_transpose:
                data[item[0]] = item[1:]
            # -- declaration of metadata begins -- 
            metadata = OrderedDict()
            metadata["Title"] = input("Enter data title: ")
            metadata["Researcher"] = input("Enter researcher name: ")
            uploadby = input("Enter name of uploader: ")
            uploadon = datetime.datetime.today().strftime('%Y-%m-%d')
            metadata["Uploaded By"] = uploadby
            metadata["Uploaded On"] = uploadon
            expdate = input("Enter experiment date in YYYY-MM-DD format: ")
            exptype = input("Enter experiment type: ")
            expcond = input("Enter experiment conditions: ")
            metadata["Experiment Date"] = expdate
            metadata["Experiment Type"] = exptype
            metadata["Experiment Conditions"] = expcond
            # -- dumps metadata and data to json file in parsed-data directory -- 
            outfile = os.path.splitext(os.path.basename(infilename))[0]
            with open(os.path.join(os.pardir, "data", "parsed-data", outfile+".json"), "w") as fp:
                output = OrderedDict()
                output["Metadata"] = metadata
                output["Data"] = data
                json.dump(output, fp, indent=4, sort_keys=False)
            jsonIndex() #reindexes index.json and hashes.json
            print("Data parse successful - parsed " + infilename + " and wrote result to parsed-data as " + os.path.splitext(infilename)[0] + ".json")
        else:
            print("No input file specified with '-i'. Specify an input file and try again.")

if __name__ == "__main__":
    main()