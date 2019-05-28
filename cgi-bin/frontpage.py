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
    from io import BytesIO
    import cgi, sys
    out = BytesIO()
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
    sys.stdout.buffer.write(out.getvalue())


def do_metadata_fields(out, form):
    _send_success(out, UploadFields)


def do_file_upload(out, form):
    datafile = form["datafile"]
    if not datafile.file:
        _send_failed(out, "no file given")
        return
    if "exptype" not in form:
        _send_failed(out, "no file type given")
        return
    exptype = form.getfirst("exptype")
    import os.path, os, datetime
    from msweb_lib import datastore
    mod = _get_module_by_type(exptype)
    filename = os.path.basename(datafile.filename)
    ds = datastore.DataStore(DataStorePath)
    tmp_file_name = ds.raw_file_name(0) + "-" + str(os.getpid())
    try:
        with open(tmp_file_name, "wb") as f:
            f.write(datafile.file.read())
        try:
            exp = mod.parse_raw(filename, tmp_file_name)
        except KeyError as e:
            _send_failed(out, str(e))
            return
        exp_id = ds.add_experiment(exp)
        raw_file_name = ds.raw_file_name(exp_id)
        os.rename(tmp_file_name, raw_file_name)
    finally:
        try:
            os.remove(tmp_file_name)
        except OSError:
            pass
    exp.write_cooked(ds.cooked_file_name(exp_id))
    ds.update_experiment(exp_id, {
        "uploader": os.environ.get("REMOTE_USER", "anonymous"),
        "uploaddate": datetime.date.today().isoformat(),
        "datafile": filename,
        "runs": {name:{} for name in exp.runs},
        "run_categories": ["control"],
        "exptype": exptype,
    })
    ds.write_index()
    _send_success(out, None)


def do_add_experiment_type(out, form):
    etype = form.getfirst("exptype")
    if not etype:
        _send_failed(out, "no experiment type given")
        return
    from msweb_lib import datastore
    ds = datastore.DataStore(DataStorePath)
    ds.add_experiment_type(etype)
    ds.write_index()
    _send_success(out, {"experiment_types":ds.experiment_types})


def do_remove_experiment_type(out, form):
    etype = form.getfirst("exptype")
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
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    # Our first uploads do not have types, but are all abundance experiments
    exptype = exp_meta.get("exptype", "abundance")
    mod = _get_module_by_type(exptype)
    exp = mod.parse_cooked(cooked)
    _send_success(out, {"experiment_data":exp.xhr_data(),
                        "experiment_id":exp_id}, cls=MyEncoder)


def do_download_experiment(out, form):
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
    mod = _get_module_by_type(form.getfirst("exptype"))
    _send_success(out, {"methods":mod.normalization_methods()})


def do_normalize(out, form):
    nc_params = _get_nc_params(form)
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    try:
        norm, cached = exp.normalized_counts(exp_meta, nc_params)
    except ValueError as e:
        _send_failed(out, str(e))
        return
    if not cached:
        exp.write_cooked(cooked)
    _send_success(out, {"params":nc_params,
                        "stats":exp.xhr_nc(norm)}, cls=MyEncoder)


def _get_nc_params(form):
    method = form.getfirst("method") if "method" in form else "default"
    params = {"method":method}
    return params


def do_differential_abundance(out, form):
    da_params = _get_da_params(form)
    try:
        ds, exp_id, exp_meta = _get_exp_metadata(out, form)
    except ValueError:
        return
    cooked = ds.cooked_file_name(exp_id)
    from msweb_lib import abundance
    exp = abundance.parse_cooked(cooked)
    try:
        da, cached = exp.differential_abundance(exp_meta, da_params)
    except ValueError as e:
        _send_failed(out, str(e))
        return
    if not cached:
        exp.write_cooked(cooked)
    _send_success(out, {"params":da_params,
                        "stats":exp.xhr_da(da)}, cls=MyEncoder)


def _get_da_params(form):
    method = form.getfirst("method") if "method" in form else "default"
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
    params = {"method":method,
              "categories":categories,
              "control":control,
              "fc_cutoff":fc_cutoff,
              "mean_cutoff":mean_cutoff}
    for p in form.keys():
        if p.startswith("nc_"):
            params[p] = form.getfirst(p)
    return params


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
    out.write("Content-Type: application/json\r\n\r\n".encode("utf-8"))
    out.write(json.dumps(value, **kw).encode("utf-8"))


def _send_download(out, f, filename, content_type=None):
    # f is the file object to send and must be opened as binary, not text
    c_type = "Content-Type: %s\r\n" % _content_type(filename, content_type)
    c_disp = "Content-Disposition: attachment; filename=\"%s\"\r\n" % filename
    header = c_type + c_disp + "\r\n"
    out.write(header.encode("utf-8"))
    out.write(f.read())


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
        ext = os.path.splitext(filename)[1].lower()
        return ContentTypes.get(ext, DefaultContentType)


def _get_module_by_type(exptype):
    if exptype.lower().startswith("abundance"):
        from msweb_lib import abundance
        return abundance
    from msweb_lib import generic
    return generic


if __name__ == "__main__":
    import os, sys
    am_cgi = "REQUEST_METHOD" in os.environ
    if am_cgi:
        cgi_main()
    else:
        from io import BytesIO
        out = BytesIO()
        _send_success(out, {"methods":["hello","world"]})
        sys.stdout.buffer.write(out.getvalue())
