# AMaSS
##### Developers: Scooter Morris, Conrad Huang
##### Past Contributors: Devon McKee, Akshay Bhamidipati, and Marie Perez.
## Table of Contents
* [What is AMaSS?](#what-is-amass)
* [Folder Hierarchy](#folder-hierarchy)
* [Versioned Changelog](#versioned-changelog)
------
# What is AMaSS?
AMaSS (Adelson Mass Spec System) is a web site for distributing and
analyzing results from mass spectrometry experiments.
AMaSS is implemented using [jQuery](https://jquery.com/),
[bootstrap](https://getbootstrap.com/), and
[bootgrid](http://www.jquery-bootgrid.com/), and
[plot.ly](https://plot.ly/).

AMaSS is designed to support multiple types of experiment results.
Currently, analysis is only available for abundance-type experiments
(e.g., label-free peptide counting and BioID screening).  Users may
normalize results from multiple runs (replicates), calculate
differential abundance among runs, and visualize these results as
violin plots, heatmaps, or volcano plots.  Data for all types
of experiments (e.g., abundance, generic) may be downloaded in
the original upload format (typically as Excel spreadsheets) or
as tab-separated-value (TSV) files if AMaSS can parse the data set.

# Folder Hierarchy
(Note: Only "important" files are listed.)
```
 AMaSS/
 ├── cgi-bin/ (Contains CGI scripts detailed later)
 │   ├── frontpage.py (Main CGI script called by web site home page)
 │   └── amass_lib (Python library for parsing and saving data sets)
 ├── experiments/
 │   ├── raw/ (Contains raw data files for later downloading)
 │   ├── cooked/ (Contains parsed data files)
 │   └── index.json (Contains data set metadata)
 └── html/ (Contains all files served directly to the user)
     ├── js/ (Contains all pertinent JS files)
     │   ├── frontpage.js (Main JS code for front page)
     │   └── fp-*.js (Per-experiment-type and support JS)
     ├── css/ (Contains all pertinent CSS files)
     │   └── frontpage.css (Main CSS code for front page)
     ├── icons/ (Contains images for use as icons)
     ├── frontpage.html (Main web page for users accessing data sets)
     ├── upload.html (Main web page for users uploading data sets)
     └── index.html (symlink to frontpage.html)

index.html and upload.html are both symlinks to frontpage.html.
index.html is present so users do not need to include "frontpage.html"
in their URL.  upload.html deletes the "Upload" tab on load, but
behaves identically to frontpage.html otherwise.
```
# Versioned Changelog
Changelog is not at all comprehensive, more specific changes can be
found in previous GitHub commits.
```
* v0.1 (June 3, 2019)
    * Reimplemented using Bootstrap and Bootgrid as main Javascript
      libraries.
    * Support new upload data format.
    * Renamed from MSWeb to AMaSS.
* v0.0.3 (September 8, 2018)
    * Changes JSON metadata format to add entries for number of columns
      and rows in each data set, as well as adding columns in experiment
      table to accommodate changed format.
    * Moves list of selected experiments to status box below experiment table.
    * Removes select button from experiment table, functionality shifted
      to user being able to click a row to select it.
* v0.0.2 (09/1/2018)
    * Adds functions to select and deselect experiments in table,
      retrieve title of data set from hash, and updating selected
      experiments in selected 
* v0.0.1 (08/31/2018)
    * Moved all previous files in html/ to html_old/.
    * Adds new index.html to html/, adds west.js/center.js/init.js,
      sets up 2-paned layout in jQuery UI, imports important library
      files from html_old.
    * Changes format of metadata to add explicit keys for
      uploader/upload date and experiment date/type/conditions.
    * Changes JSON indexing to use OrderedDict to create metadata in JSON file.
    * Adds functions to populate experiment table with data sets from index.json
* Pre v0.0.1 (08/01/2018-08/30/2018)
    * MSWeb initial layout. (Files found in html_old) Page now set up
      with jQuery/jQuery UI. Comprised of three main layout containers
      (west, center, and south). West container contains title,
      search bar, and experiment filters. Experiments are shown in
      jQuery multiselect box and basic plotting completed in south div,
      as well as initial implementation of react-chart-editor.
* Initial Stage (06/26/2018-07/30/2018)
    * Tool in its most basic form. Entire page initially created
      with basic HTML/JavaScript and eventually partially in React.
      Tool has basic framework for data parsing and retrieval,
      but plotting is limited to basic plot.ly plotting.
```
