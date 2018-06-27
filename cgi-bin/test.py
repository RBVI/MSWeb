#!/usr/bin/python3

import enable_cgitb

def main():
    import cgi
    form = cgi.FieldStorage()
    print("Content-Type: text/html")
    print("")
    print("<!DOCTYPE html>")        # HTML 5 doctype
    print("<html>")
    print("<head>")                 # set title
    print("<title>Display Parameters</title>")
    print("</head>")
    print("<body>")

    print("<h1>Parameters</h1>")
    keys = list(form.keys())
    if len(keys) == 0:
        print("<p>No parameters given</p>")
    else:
        print("<table>")
        print("<tr>")
        print("<th>Name</th>")
        print("<th>Value</th>")
        print("</tr>")
        for k in sorted(keys):
            print("<tr>")
            print("<td>%s</td>" % k)
            print("<td>%s</td>" % form.getvalue(k))
            print("</tr>")
        print("</table>")

    print("</body>")
    print("</html>")

if __name__ == "__main__":
    main()
