# MSWeb
##### Main Contributors: Devon McKee, Akshay Bhamidipati, and Marie Perez.
## Table of Contents
* [What is MSWeb?](#what-is-msweb)
* [Folder Hierarchy](#folder-hierarchy)
* [CGI Scripts](#cgi-scripts)
    * [Debugging CGI](#debugging-cgi)
    * [Standard CGI](#standard-cgi)
    * [Non-CGI Scripts](#non-cgi-scripts)
    * [Deprecated Scripts](#deprecated-scripts)
* [Versioned Changelog](#versioned-changelog)
------
# What is MSWeb?
MSWeb is a higher-level data visualization and analysis tool for use with Mass Spectrometry data. MSWeb implements [jQuery](https://jquery.com/), [plot.ly](https://plot.ly/), [React](https://reactjs.org/), [react-plotly](https://github.com/plotly/react-plotly.js), and [react-chart-editor](https://github.com/plotly/react-chart-editor) to create charts of mass spectrometry data. On release, the tool will be able to plot many types of standard plots, as well as some more specialized ones, including volcano plots, violin plots, and dendrograms. Data is retrieved from a repository of parsed JSON files containing data from a range of data sets, including user uploaded sets. Issues with and suggestions for the tool can be emailed to dmckee@cgl.ucsf.edu.

# Folder Hierarchy
(Note: Does not include all files, especially library files such as jQuery/Plot.ly/React)
```
 MSWeb/
 ├── cgi-bin/ (Contains CGI scripts detailed later)
 ├── data/
 │   ├── raw-data/ (Contains raw data files for later downloading)
 │   ├── parsed-data/ (Contains parsed data files)
 │   ├── index.json (Contains list of all parsed data sets and metadata)
 │   └── hashes.json (Contains a dictionary with hashes:filename as key:value)
 ├── html/ (Contains all files served directly to the user)
 │   ├── js/ (Contains all pertinent JS files)
 │   │   ├── center.js (Contains all code pertaining to the center container 
 │   │   │   of the page)
 │   │   ├── west.js (Contains all code pertaining to the west container of 
 │   │   │   the page)
 │   │   └── init.js (Contains initialization code and code that covers both 
 │   │       west and center containers)
 │   ├── css/ (Contains all pertinent CSS files)
 │   ├── icons/ (Contains images for use as icons)
 │   └── index.html (Main web page served to users when visiting MSWeb)
 └── html_old/ (Contains all files from html folder before versioning began)
```
# CGI Scripts
Detailed in this section are the various CGI scripts included with MSWeb. Each script is written in Python 3 and serves a different purpose. CGI (and non-CGI) scripts in this section will be described as follows in this template:
```
Script Name: <file name>
Script Usage: <description of usage>
Script Purpose: <description of script purpose>
```
## Debugging CGI
```
Script Name: cgiHeaders.py
Script Usage: GET "cgiHeaders.py?test=1&test=2"
Script Purpose: Returns given CGI headers as plain text
```
```
Script Name: getUmask.py
Script Usage: GET "getUmask.py" OR GET "getUmask.py?set=<umask value>"
Script Purpose: Either gets current umask and returns a plain text report or sets umask to given value, creates and removes a test file, and returns a plain text report of initial and set umask value.
```
## Standard CGI
```
Script Name: downloadData.py
Script Usage: GET "downloadData.py?hash=<hash 1>&hash=<hash 2>"
Script Purpose: Takes 1 or more SHA-256 hashes as GET request headers and returns a .zip file containing the raw files of those data sets.
```
```
Script Name: retrieveIndex.py
Script Usage: $.getJSON("retrieveIndex.py")
Script Purpose: Retrieves index.json for creation of experiment table.
```
```
Script Name: retrieveJSON.py
Script Usage: GET "retrieveJSON.py?hash=<hash of data set>"
Script Purpose: Retrieves parsed-data JSON file of given data set SHA-256 hash. Returns JSON file directly as application/json.
```
```
Script Name: txttoJSON.py
Script Usage: POST "txttoJSON.py" Headers: uploadtitle, uploadresearcher, uploadexperimentdate, uploadexperimenttype, uploadexperimentcond, uploadfile OR CMD "python txttoJSON.py -i <name of input data set>"
Script Purpose: Python script run via CGI or via command line to add and parse new data sets. When used via a POST request, headers including metadata (excluding uploader and upload date) and a header including the file are required. When used via command line, user must specify input file with -i flag in command execution and then user is prompted to enter metadata. Script also reindexes JSON files using indexJSON.py at end of script.
```
## Non-CGI Scripts
```
Script Name: enable_cgitb.py
Script Usage: N/A
Script Purpose: Implemented in other CGI scripts, enables cgitb for detailed error reporting
```
```
Script Name: indexJSON.py
Script Usage: CMD "python indexJSON.py"
Script Purpose: Indexes parsed-data directory, retrieves metadata from each file and adds metadata and SHA-256 hash of filename to index.json, and then updates hashes.json with dictionary of hash:filename as key:value.
```
```
Script Name: removeData.py
Script Usage: CMD "python removeData.py -i <data set name w/o extension>"
Script Purpose: Used in command line to remove data set from raw-data directory, parsed-data directory, and then reindexes index.json and hashes.json with updated list of datasets.
```
## Deprecated Scripts
```
Script Name: index.py
Script Usage: GET "index.py"
Script Purpose: Used in initial build of MSWeb to index data directory (No longer used as file indexing now involves metadata and is in a new directory)
```
```
Script Name: loadData.py
Script Usage: GET "loadData.py?data=<data set filename>&data1=<column 1>&data2=<column 2>"
Script Purpose: Used in initial build of MSWeb to load two specified columns from a specified data set, for use in display table.
```
```
Script Name: loadHeader.py
Script Usage: GET "loadHeader.py?data=<data set>"
Script Purpose: Used in initial build of MSWeb to load headers of a specified data set (Retrieves headers on the fly as script predates parsed JSON formatting)
```
```
Script Name: parsetxt.py
Script Usage: CMD "python parsetxt.py -i <filename>"
Script Purpose: Used in initial build of MSWeb to parse and read headers of data set in command line.
```
```
Script Name: test.py
Script Usage: GET "test.py" 
Script Purpose: Used in initial build of MSWeb to demo CGI scripting in Python 3.
```
```
Script Name: xlsxtoJSON.py
Script Usage: CMD "python xlsxtoJSON.py -i <input xlsx file> -t <sheet type>"
Script Purpose: Used for a brief period to parse .xlsx files to retrieve data. Incomplete, with no plans for real implementation.
```
# Versioned Changelog
Changelog is not at all comprehensive, more specific changes can be found in previous GitHub commits.
* Initial Stage (06/26/2018-07/30/2018)
    * Tool in its most basic form. Entire page initially created with basic HTML/JavaScript and eventually partially in React. Tool has basic framework for data parsing and retrieval, but plotting is limited to basic plot.ly plotting.
* Pre v0.0.1 (08/01/2018-08/30/2018)
    * MSWeb initial layout. (Files found in html_old) Page now set up with jQuery/jQuery UI. Comprised of three main layout containers (west, center, and south). West container contains title, search bar, and experiment filters. Experiments are shown in jQuery multiselect box and basic plotting completed in south div, as well as initial implementation of react-chart-editor.
* v0.0.1 (08/31/2018)
    * Moved all previous files in html/ to html_old/.
    * Adds new index.html to html/, adds west.js/center.js/init.js, sets up 2-paned layout in jQuery UI, imports important library files from html_old.
    * Changes format of metadata to add explicit keys for uploader/upload date and experiment date/type/conditions.
    * Changes JSON indexing to use OrderedDict to create metadata in JSON file.
    * Adds functions to populate experiment table with data sets from index.json
* v0.0.2 (09/1/2018)
    * Adds functions to select and deselect experiments in table, retrieve title of data set from hash, and updating selected experiments in selected bar.
* v0.0.3 (09/8/2018)
    * Changes JSON metadata format to add entries for number of columns and rows in each data set, as well as adding columns in experiment table to accommodate changed format.
    * Moves list of selected experiments to status box below experiment table.
    * Removes select button from experiment table, functionality shifted to user being able to click a row to select it.
* v0.0.4 (In progress)