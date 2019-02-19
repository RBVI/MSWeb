#!/usr/bin/python
# vim: expandtab shiftwidth=4 softtabstop=4:
from __future__ import print_function


DataStorePath = "../experiments"
UploadFields = [
    # Format (matching templates/upload.html) is:
    #   (label, input_type, input_id, input_attributes)
    # where input_attributes format is:
    #   ((key, value), ...)
    ( "Title", "text", "title", (
        ("placeholder", "title of experiment"), )),
    ( "Researcher", "text", "researcher", (
        ("placeholder", "name of requester"), )),
    ( "Experiment Type", "text", "exptype", (
        ("placeholder", "type of experiment"), )),
    ( "Experiment Date", "date", "expdate", (
        ("placeholder", "date of experiment"), )),
    ( "Notes", "textarea", "expnotes", (
        ("placeholder", "free text"), )),
    ( "Uploader", "text", "uploader", ()),
    ( "Upload Date", "date", "uploaddate", ()),
    ( "Data File", "text", "datafile", ()),
]


def cgi_main():
    import StringIO, cgi, sys
    out = StringIO.StringIO()
    try:
        form = cgi.FieldStorage()
        action = form.getfirst("action", "none")
        try:
            func = globals()["do_" + action]
        except KeyError:
            _send_failed(out, "Unknown request: %s" % action)
        else:
            func(out, form)
    except:
        import traceback
        _send_failed(out, "Python error", traceback.format_exc())
    sys.stdout.write(out.getvalue())


def do_metadata_fields(out, form):
    _send_success(out, UploadFields)


def do_file_upload(out, form):
    datafile = form.getfirst("datafile")
    if not datafile.file:
        _send_failed(out, "no file given")
        return
    import os.path, os, datetime
    from msweb_lib import datastore, parse_combined
    filename = os.path.basename(datafile.filename)
    metadata = {
        "uploader": os.environ.get("REMOTE_USER", "anonymous"),
        "uploaddate": datetime.date.today().isoformat(),
        "datafile": filename,
    }
    ds = datastore.DataStore(DataStorePath)
    exp_id = ds.add_experiment(metadata)
    raw_file_name = ds.raw_file_name(exp_id)
    with open(raw_file_name, "wb") as f:
        f.write(datafile.file.read())
    exp = parse_combined.parse_combined(raw_file_name, metadata=metadata)
    with open(ds.cooked_file_name(exp_id), "w") as f:
        exp.write_json(f)
    ds.write_index()
    _send_success(out, None)


def do_add_experiment_type(out, form):
    etype = form.getfirst("exp_type")
    if not etype:
        _send_failed(out, "no experiment type given")
        return
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    ds.add_experiment_type(etype)
    ds.write_index()
    _send_success(out, None)


def do_add_run_category(out, form):
    rcat = form.getfirst("run_cat")
    if not rcat:
        _send_failed(out, "no run category given")
        return
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    ds.add_run_category(rcat)
    ds.write_index()
    _send_success(out, None)


def do_controlled_vocabulary(out, form):
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    _send_success(out, {"experiment_types": ds.experiment_types,
                        "run_categories": ds.run_categories})


def do_incomplete_uploads(out, form):
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    uploads = {}
    for exp_id, exp in ds.experiments.items():
        if not exp.get("complete", False):
            uploads[exp_id] = exp
    _send_success(out, uploads)


def do_all_experiments(out, form):
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    experiments = {}
    # We can modify the "ds.experiments" dictionaries
    # because we exit right afterwards as a CGI script.
    # If we are more persistent, we need to make a
    # copy rather than modify the data (although storing
    # a "status" field may not be a bad thing).
    for exp_id, exp in ds.experiments.items():
        exp["status"] = ds.experiment_status(exp)
        experiments[exp_id] = exp
    _send_success(out, experiments)


def do_delete_experiment(out, form):
    from msweb_lib import datastore
    import os
    if not form.has_key("exp_id"):
        _send_failed(out, "no experiment specified", "missing experiment id")
        return
    ds = datastore.DataStore(DataStorePath)
    try:
        exp_id = form.getfirst("exp_id")
        del ds.experiments[exp_id]
    except (ValueError, KeyError):
        _send_failed(out, "invalid experiment selected",
                          "experiment id: %r" % exp_id)
        return
    ds.write_index()
    cooked = ds.cooked_file_name(exp_id)
    raw = ds.raw_file_name(exp_id)
    try:
        os.remove(cooked)
    except OSError:
        pass
    try:
        os.remove(raw)
    except OSError:
        pass
    _send_success(out, None)


def _send_failed(out, reason, cause="unspecified"):
    _send_json(out, {
        "status": "error",
        "reason": reason,
        "cause": cause,
    })


def _send_success(out, value):
    _send_json(out, {
        "status": "success",
        "results": value,
    })


def _send_json(out, value):
    import json
    print("Content-Type: application/json", file=out)
    print(file=out)
    json.dump(value, out)


if __name__ == "__main__":
    import os
    am_cgi = os.environ.has_key("REQUEST_METHOD")
    if am_cgi:
        cgi_main()
    else:
        import sys
        do_delete_experiment(sys.stdout, None)
