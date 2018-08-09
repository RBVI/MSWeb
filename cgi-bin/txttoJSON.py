#!/usr/local/bin/python3
import json, os, sys, cgi, datetime
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
        import enable_cgitb
        form = cgi.FieldStorage()
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
        else:
            print("No input file specified with '-i'. Specify an input file and try again.")

if __name__ == "__main__":
    main()