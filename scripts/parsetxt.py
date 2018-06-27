import sys
def getArgs (argv): #defines function to add -[letter] [input] pairs into dictionary
    args = {}
    while argv:
        if argv[0][0] == "-":
            args[argv[0]] = argv[1]
        argv = argv[1:]
    return args
args = getArgs(sys.argv)
if "-i" in args.keys():
    inputfile = open(args["-i"], "r")
    lines = inputfile.readlines()
    lines = lines[3:] #strips first three lines to create header
    header = lines[0].split("\t") #splits column headers by tab and adds to list
    header[0] = "Data #" # adds 'Data #' as first column header because .txt is missing it 
    data = []
    for line in lines[1:]:
        data.append(line.split("\t"))
else:
    print("No input file specified with '-i'. Run script and specify input file as '-i <inputfile>.txt' and try again")