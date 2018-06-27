import cgitb
# Fix stupid Python cgitb extraneous output
cgitb._reset = cgitb.reset
cgitb.reset = lambda: cgitb._reset().replace('<!--: spam\n', '')
cgitb.enable()
