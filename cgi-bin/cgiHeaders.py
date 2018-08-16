#!/usr/local/bin/python3
import cgi, enable_cgitb

def main():
    form = cgi.FieldStorage()
    args = {}
    for arg in form:
         args[arg] = form.getvalue(arg)
    print("Content-Type: text")
    print("")
    print(args)

if __name__ == "__main__":
    main()