#!/usr/local/bin/python3
import os, cgi, enable_cgitb

def main():
    initUmask = os.umask(0)
    os.umask(initUmask)
    print("Content-Type: text")
    print("")
    print("Current umask is "+str(initUmask))

if __name__ == "__main__":
    main()