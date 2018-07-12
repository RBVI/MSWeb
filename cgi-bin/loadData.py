#!/usr/local/bin/python3

import enable_cgitb
import os

def main():
    import cgi
    form = cgi.FieldStorage()
    input = {}
    for item in form:
        input[item] = form.getvalue(item)
    inputfile = open(os.path.join(os.pardir, 'data', input["data"]),"r")
    lines = inputfile.readlines()
    lines = lines[3:] #strips first three lines to create header
    header = lines[0].split("\t") #splits column headers by tab and adds to list
    header[0] = "Data #" # adds 'Data #' as first column header because .txt is missing it 
    data = []
    for line in lines[1:]:
        data.append(line.split("\t"))
    output = []
    output.append(str(input["data1"])+"|"+str(input["data2"]))
    index1 = header.index(input["data1"])
    index2 = header.index(input["data2"])
    for item in data:
        output.append(str(item[index1])+"|"+str(item[index2]))
    print("Content-Type: text")
    print("")
    for line in output:
        print(line)
if __name__ == "__main__":
    main()