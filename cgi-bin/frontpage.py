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
    ( "Experiment Type", "exptype", "exptype", (
        ("placeholder", "type of experiment"), )),
    ( "Researcher", "text", "researcher", (
        ("placeholder", "name of requester"), )),
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
    datafile = form["datafile"]
    if not datafile.file:
        _send_failed(out, "no file given")
        return
    import os.path, os, datetime
    from msweb_lib import datastore, abundance
    filename = os.path.basename(datafile.filename)
    ds = datastore.DataStore(DataStorePath)
    exp_id = ds.add_experiment(None)
    raw_file_name = ds.raw_file_name(exp_id)
    with open(raw_file_name, "wb") as f:
        f.write(datafile.file.read())
    exp = abundance.parse_raw(raw_file_name)
    with open(ds.cooked_file_name(exp_id), "w") as f:
        exp.write_json(f)
    ds.update_experiment(exp_id, {
        "uploader": os.environ.get("REMOTE_USER", "anonymous"),
        "uploaddate": datetime.date.today().isoformat(),
        "datafile": filename,
        "runs": { name: {} for name in exp.runs.keys() },
        "run_categories": ["control"],
    })
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
    _send_success(out, {"experiment_types":ds.experiment_types})


def do_remove_experiment_type(out, form):
    etype = form.getfirst("exp_type")
    if not etype:
        _send_failed(out, "no experiment type given")
        return
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    ds.remove_experiment_type(etype)
    ds.write_index()
    _send_success(out, {"experiment_types":ds.experiment_types})


def do_controlled_vocabulary(out, form):
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    _send_success(out, {"experiment_types": ds.experiment_types})


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
    try:
        ds, exp_id, exp = _get_exp_metadata(out, form)
    except ValueError:
        return
    del ds.experiments[exp_id]
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


def do_add_run_category(out, form):
    rcat = form.getfirst("run_cat")
    if not rcat:
        _send_failed(out, "no run category given")
        return
    try:
        ds, exp_id, exp = _get_exp_metadata(out, form)
    except ValueError:
        return
    ds.add_run_category(exp_id, rcat)
    ds.write_index()
    _send_success(out, {"exp_id":exp_id,
                        "run_categories":exp["run_categories"]})


def do_remove_run_category(out, form):
    rcat = form.getfirst("run_cat")
    if not rcat:
        _send_failed(out, "no run category given")
        return
    try:
        ds, exp_id, exp = _get_exp_metadata(out, form)
    except ValueError:
        return
    ds.remove_run_category(exp_id, rcat)
    ds.write_index()
    _send_success(out, {"exp_id":exp_id,
                        "run_categories":exp["run_categories"]})


def do_update_experiment(out, form):
    try:
        ds, exp_id, exp = _get_exp_metadata(out, form)
    except ValueError:
        return

    # Update experiment metadata
    updated = []
    deleted = []
    for key in form.keys():
        if key in [ "action", "exp_id", "runs" ]:
            continue
        value = form.getfirst(key)
        if value:
            exp[key] = value
            updated.append(key)
        else:
            del exp[key]
            deleted.append(key)

    # Update runs metadata
    runs = exp.get("runs", None)
    runs_data = form.getfirst("runs")
    if runs and runs_data:
        import json
        data = json.loads(runs_data)
        for run_name, run_data in data.items():
            runs[run_name].update(run_data)

    # Save and respond
    ds.write_index()
    _send_success(out, {"updated":updated, "deleted":deleted})


def do_get_experiment(out, form):
    from msweb_lib import abundance
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    with open(cooked) as f:
        _send_success(out, {"experiment_data":f.read(),
                            "experiment_id":exp_id})


def do_download_experiment(out, form):
    from msweb_lib import abundance
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    raw = ds.raw_file_name(exp_id)
    with open(raw, "rb") as f:
        _send_download(out, f, exp_meta["datafile"]);


def do_normalization_methods(out, form):
    if not form.has_key("exptype"):
        _send_failed(out, "no experiment type specified")
        return
    m = _module_for(form.getfirst("exptype"))
    _send_success(out, {"methods":m.normalization_methods})


def do_normalize(out, form):
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    try:
        norm, cached = exp.normalize(exp_meta, form)
    except ValueError as e:
        _send_failed(out, str(e))
        return
    if not cached:
        with open(cooked, "w") as f:
            exp.write_json(f)
    _send_success(out, norm)


def _get_exp_metadata(out, form):
    from msweb_lib import datastore
    if not form.has_key("exp_id"):
        _send_failed(out, "no experiment specified", "missing experiment id")
        raise ValueError("no experiment specified")
    ds = datastore.DataStore(DataStorePath)
    try:
        exp_id = form.getfirst("exp_id")
        exp = ds.experiments[exp_id]
    except (ValueError, KeyError):
        _send_failed(out, "invalid experiment selected",
                          "experiment id: %r" % exp_id)
        raise ValueError("invalid experiment specified")
    return ds, exp_id, exp


def _send_failed(out, reason, cause=""):
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


def _send_download(out, f, filename, content_type=None):
    print("Content-Type: %s" % _content_type(filename, content_type), file=out)
    print("Content-Disposition: attachment; filename=\"%s\"" % filename)
    print(file=out)
    out.write(f.read())


def _module_for(exptype):
    if exptype == "abundance":
        from msweb_lib import abundance
        return abundance
    raise ValueError("unknown experiment type: %s" % exptype)


DefaultContentType = "application/octet-stream"
ContentTypes = {
    ".xls": "application//vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _content_type(filename, content_type):
    if content_type:
        return content_type
    else:
        import os.path
        ext = os.path.splitext(filename)[1]
        return ContentTypes.get(ext, DefaultContentType)


if __name__ == "__main__":
    import os
    am_cgi = os.environ.has_key("REQUEST_METHOD")
    if am_cgi:
        cgi_main()
    else:
        import sys
        do_delete_experiment(sys.stdout, None)
