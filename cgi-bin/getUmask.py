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
        print("Content-Type: text")
        print("")
        print("Umask Report: ")
        print("")
        umask = 0o002
        print("Umask set to: "+"0o{0:o}".format(umask))
        initUmask = os.umask(umask)
        fname = ""
        testPath = os.path.join(os.pardir, "data", "raw-data", "test.txt")
        with open(testPath, "w") as fp:
            fp.write("test")
            fname = fp.name
        fileStat = os.stat(testPath)
        print("File "+fname+" created with permissions "+str(fileStat.st_mode))
        print("(Converted ST_MODE: "+str(stat.filemode(fileStat.st_mode))+")")
        os.remove(testPath)
        print(fname+" removed")
        print("-----------------------")
        os.umask(initUmask)
        print("Initial umask is: "+"0o{0:o}".format(initUmask))
        with open(testPath, "w") as fp:
            fp.write("test")
        fileStat = os.stat(testPath)
        print("File "+fname+" created with permissions "+str(fileStat.st_mode))
        print("(Converted ST_MODE: "+str(stat.filemode(fileStat.st_mode))+")")
        os.remove(testPath)
        print(fname+" removed")


if __name__ == "__main__":
    main()