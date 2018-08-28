#!/usr/local/bin/python3
import os, cgi, enable_cgitb, stat

def main():
    form = cgi.FieldStorage()
    set = form.getvalue("set")
    if not set:
        initUmask = os.umask(0)
        os.umask(initUmask)
        print("Content-Type: text")
        print("")
        print("Current umask is "+str(initUmask))
    elif set == "true":
        initUmask = os.umask(0)
        fname = ""
        testPath = os.path.join(os.pardir, "data", "raw-data", "test.txt")
        with open(testPath, "w") as fp:
            fp.write("test")
            fname = fp.name
        os.umask(initUmask)
        fileStat = os.stat(testPath)
        print("Content-Type: text")
        print("")
        print("Initial umask is "+str(initUmask))
        print("File "+fname+" created with permissions "+str(fileStat.st_mode))
        print("(Converted ST_MODE: "+str(stat.filemode(fileStat.st_mode))+")")

if __name__ == "__main__":
    main()