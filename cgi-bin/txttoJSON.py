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
    print("Content-Type: text/html")
    print("")
    print("<!DOCTYPE html>")
    print("<html>")
    print("<head>")
    print("<title>Error</title>")
    print("</head>")
    if exception == "syntax":
        print("<h1>Syntax Error</h1>")
        print("<p>The uploader script has thrown a syntax error.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
    elif exception == "value":
        print("<h1>Value Error</h1>")
        print("<p>The uploader script has thrown a value error.</p>")
        print("<p>The uploaded file probably is not a TSV file.</p>")
    elif exception == "fileexists":
        print("<h1>Error (File exists)</h1>")
        print("<p>Either the file being uploaded or the parsed version already exist on the server.</p>")
        print("<p>Check list of datasets for existing file and if this error has been thrown incorrectly, please report error and conditions to "+reporter+"</p>")
    elif exception == "permission":
        print("<h1>Permission Error</h1>")
        print("<p>A permission error has been thrown.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
    else:
        print("<h1>Error</h1>")
        print("<p>An unknown error has occurred in the uploader script.</p>")
        print("<p>Please report error and conditions to "+reporter+"</p>")
    print("</body>")
    print("</html>")
    raise SystemExit(0)

def main():
    if "REQUEST_METHOD" in os.environ:
        #running as cgi
        form = cgi.FieldStorage()
        args = {}
        for arg in form:
            args[arg] = form.getvalue(arg)
        infile = form['uploadfile'].file
        basefile = form["uploadfile"].filename
        if os.sep in basefile:
            returnFail("permission")
        infile = os.path.join(os.pardir, "data", "raw-data", basefile)
        outfile = os.path.join(os.pardir, "data", "parsed-data",
                               os.path.splitext(basefile)[0]+".json")
        if os.path.exists(infile) or os.path.exists(outfile):
            returnFail("fileexists")
        try:
            initUmask = os.umask(0o002)
            with open(infile, 'wb') as fp:
                fp.write(infile.read())
            data = parse_file(infile)
            metadata = OrderedDict()
            metadata["Title"] = args["uploadtitle"]
            metadata["Researcher"] = args["uploadresearcher"]
            metadata["Uploaded By"] = "Anonymous" #handles username of uploader later, right now enter 'Anonymous'
            metadata["Uploaded On"] = datetime.datetime.today().strftime('%Y-%m-%d')
            metadata["Experiment Date"] = args["uploadexperimentdate"]
            metadata["Experiment Type"] = args["uploadexperimenttype"]
            metadata["Experiment Conditions"] = args["uploadexperimentcond"]
            with open(outfile, 'w') as fp:
                output = OrderedDict()
                output["Metadata"] = metadata
                output["Data"] = data
                json.dump(output, fp, indent=4, sort_keys=False)
            os.umask(initUmask)
            jsonIndex() #reindexes index.json and hashes.json
            returnSuccess(metadata, form) #returns success html page
        except PermissionError as e:
            #returnFail("permission")
            print("Content-Type: text")
            print("")
            print(e)
        except SyntaxError:
            returnFail("syntax")
        except ValueError:
            returnFail("value")
        except NameError:
            returnFail("syntax")
    else:
        #running locally
        args = getArgs(sys.argv)
        if "-i" in args:
            filename = args["-i"]
            try:
                data = parse_file(os.path.join(os.pardir, 'data',
                                               'raw-data', filename))
            except ValueError as e:
                print("%s: %s" % (filename, str(e)))
                raise SystemExit(1)
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
            outfile = os.path.splitext(filename)[0] + ".json"
            with open(os.path.join(os.pardir, "data",
                                   "parsed-data", outfile), "w") as fp:
                output = OrderedDict()
                output["Metadata"] = metadata
                output["Data"] = data
                json.dump(output, fp, indent=4, sort_keys=False)
            jsonIndex() #reindexes index.json and hashes.json
            print("Data parse successful - parsed", filename,
                  "and wrote result to parsed-data as", outfile)
        else:
            print("No input file specified with '-i'.",
                  "Specify an input file and try again.")


def parse_file(filename):
    records = []
    with open(filename) as fp:
        # Try to detect the header line.
        # Heuristic is that there must be at least three columns
        # and no more than one unnamed column (which gets renamed
        # to "Data #")
        column_count = -1
        line_number = 0
        for line in fp:
            line_number += 1
            # Remove newline but not tabs
            if line[-1] == '\n':
                line = line[:-1]
            fields = [field.strip() for field in line.split('\t')]
            if column_count > 0:
                # We are in data section.  Check for right number of columns
                if len(fields) != column_count:
                    raise ValueError("bad data on line %d" % line_number)
                records.append(fields)
            else:
                if len(fields) < 3:
                    continue
                empty = 0
                for i, field in enumerate(fields):
                    if not field:
                        empty += 1
                        fields[i] = "Data #"
                if empty > 1:
                    continue
                records.append(fields)
                column_count = len(fields)
    if len(records) < 5:
        raise ValueError("too few records: %d" % len(records))
    #data_parsed = data_parsed[:20] #debug, limits to 20 data points
    data_transpose = list(zip(*records))
    data = OrderedDict()
    for item in data_transpose:
        data[item[0]] = item[1:]
    return data

if __name__ == "__main__":
    main()
