#!/usr/bin/python3
# vim: expandtab shiftwidth=4 softtabstop=4:
from __future__ import print_function

# Hack to make NaN/Inf/-Inf print as "null"
import json.encoder
class MyEncoder(json.encoder.JSONEncoder):

    def iterencode(self, o, **kw):
        def my_floatstr(o, _repr=float.__repr__,
                        _inf=float("inf"), _neginf=float("-inf")):
            if o != o or o == _inf or o == _neginf:
                return "null"
            else:
                return _repr(o)
        if self.check_circular:
            markers = {}
        else:
            markers = None
        if self.ensure_ascii:
            _encoder = json.encoder.encode_basestring_ascii
        else:
            _encoder = json.encoder.encode_basestring
        _iterencode = json.encoder._make_iterencode(
            None, self.default, _encoder, self.indent, my_floatstr,
            self.key_separator, self.item_separator, self.sort_keys,
            self.skipkeys, False)
        return _iterencode(o, 0)
# End hack


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
    try:
        from StringIO import StringIO
    except ImportError:
        from io import StringIO
    import cgi, sys
    out = StringIO()
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
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    _send_success(out, {"experiment_data":exp.xhr_data(),
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
    if "exptype" not in form:
        _send_failed(out, "no experiment type specified")
        return
    m = _module_for(form.getfirst("exptype"))
    _send_success(out, {"methods":m.normalization_methods})


def do_normalize(out, form):
    if "method" not in form:
        raise ValueError("no normalization method specified")
    method = form.getfirst("method")
    params = form.getlist("params")
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    try:
        norm, cached = exp.normalize(exp_meta, method, params)
    except ValueError as e:
        _send_failed(out, str(e))
        return
    if not cached:
        with open(cooked, "w") as f:
            exp.write_json(f)
    _send_success(out, norm.json_data(), cls=MyEncoder)


def do_differential_abundance(out, form):
    if "method" not in form:
        raise ValueError("no normalization method specified")
    norm_method = form.getfirst("method")
    norm_params = form.getlist("params")
    categories = form.getlist("categories")
    if not categories:
        raise ValueError("no differential categories specified")
    if "control" not in form:
        raise ValueError("no control category specified")
    control = form.getfirst("control")
    try:
        fc_cutoff = float(form.getfirst("fc_cutoff", "1.0"))
    except ValueError:
        raise ValueError("non-number value for fold change cutoff")
    try:
        mean_cutoff = float(form.getfirst("mean_cutoff", "0.0"))
    except ValueError:
        raise ValueError("non-number value for mean cutoff")
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    try:
        da, cached = exp.differential_abundance(exp_meta, norm_method,
                                                norm_params, categories,
                                                control, fc_cutoff,
                                                mean_cutoff)
    except ValueError as e:
        _send_failed(out, str(e))
        return
    if not cached:
        with open(cooked, "w") as f:
            exp.write_json(f)
    _send_success(out, da.xhr_data(), cls=MyEncoder)


def _get_exp_metadata(out, form):
    from msweb_lib import datastore
    if "exp_id" not in form:
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


def _send_failed(out, reason, cause="", **kw):
    _send_json(out, {
        "status": "error",
        "reason": reason,
        "cause": cause,
    })


def _send_success(out, value, **kw):
    _send_json(out, {
        "status": "success",
        "results": value,
    }, **kw)


def _send_json(out, value, **kw):
    import json
    print("Content-Type: application/json", file=out)
    print(file=out)
    json.dump(value, out, **kw)


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
    am_cgi = "REQUEST_METHOD" in os.environ
    if am_cgi:
        cgi_main()
    else:
        import sys
        from msweb_lib import datastore
        exp_id = "17"
        ds = datastore.DataStore(DataStorePath)
        exp = ds.experiments[exp_id]
        cooked = ds.cooked_file_name(exp_id)
        from msweb_lib import abundance
        exp = abundance.parse_cooked(cooked)
        _send_success(sys.stdout, {"experiment_data":exp.xhr_data(),
                                   "experiment_id":exp_id})
