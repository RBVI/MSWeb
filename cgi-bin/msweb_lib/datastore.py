#!/usr/bin/python3
# vim: set expandtab ts=4 sw=4:
from __future__ import print_function

"""MSWeb data store.

MSWeb data is stored in a directory with an index of
experiments, a raw data directory, and a parsed data
directory.

The index, "index.json" at the root of the data store,
maps MSWeb experiments to unique identifiers,
which are used as part of file names in the two data
directories.  The unique identifiers, essentially
auto-incremented integers, are used so that experiment
data files may be moved around independently from their
content (e.g., changing the title of an experiment does
not change any file names).

The "raw" data directory contains the actual uploaded files,
so the "original" can always be recovered and reprocessed.
The "cooked" data directory contains JSON files parsed
from the raw data files.  There should be a one-to-one
correspondence of files in the two data directories.
"""

#
# Layout of index.json data is (using an example with
# two experiments):
#
#   {
#       "creator": "MSWeb",
#       "version": 1,
#       "uid": 3,
#       "experiment_types": [ "T1" ],           # controlled vocab
#       "datadirs": [ "raw", "cooked" ],        # version-dependent
#       "experiments": {                        # version-dependent
#           "1": {
#                   "datafile": "uploaded_MSWeb.XLSX",
#                   "title": "First experiment",
#                   "researcher": "Someone Else",
#                   "expdate": "10/20/2018",
#                   ...
#                   "run_categories": ["control"],
#                   "runs": {
#                       "run1": { "category": "C1", "date": "09/20/2018" },
#                       ...
#                   },
#              },
#           "2": {
#                   "datafile": "new_experiment.xlsx",
#                   "title": "Second experiment",
#                   ...
#              }
#       }
#   }
#
# "creator" and "version" are used to verify that the index
# uses an expected/readable format.  "uid" is the key for
# the next "experiments" entry.  The values in "experiments"
# are replicated in the "cooked" data files are in the index
# to avoid having to open data files for basic information.
# Currently, "experiments" values also match those listed in
# the upload form.
#
# Note that experiment keys are strings, even though our
# unique ID field is an integer.  We really do not care
# which type it is since they are unique identifiers and
# not meant to be combined arithmetically.  JSON, on the
# other hand, only allows strings as dictionary keys.
# So we use strings as unique experiment identifiers.
#


class DataStore:

    IndexFile = "index.json"
    Creator = "MSWeb"
    Version = 1

    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.read_index()

    def read_index(self):
        import os.path, json
        index_file = os.path.join(self.base_dir, self.IndexFile)
        if not os.path.exists(index_file):
            self.uid = 1
            self.raw_dir = "raw"
            self.cooked_dir = "cooked"
            self.experiment_types = ["abundance"]
            self.experiments = {}
        else:
            with open(index_file) as f:
                index_data = json.load(f)
            if index_data.get("creator", None) != self.Creator:
                raise ValueError("incorrect 'Creator' name")
            if index_data.get("version", None) != self.Version:
                raise ValueError("incorrect 'Version' number")
            self.uid = index_data["uid"]
            self.raw_dir, self.cooked_dir = index_data["datadirs"]
            self.experiment_types = index_data.get("experiment_types", [])
            self.experiments = index_data["experiments"]

    def write_index(self):
        index_data = {
            "creator": self.Creator,
            "version": self.Version,
            "uid": self.uid,
            "datadirs": [ self.raw_dir, self.cooked_dir ],
            "experiment_types": self.experiment_types,
            "experiments": self.experiments,
        }
        import os.path, json
        with open(os.path.join(self.base_dir, self.IndexFile), "w") as f:
            json.dump(index_data, f)

    def experiment_status(self, exp):
        try:
            for attr in ["title", "researcher", "expdate",
                         "exptype", "datafile"]:
                if not exp.get(attr):
                    raise ValueError("no %s" % attr)
            for run_name, run_data in exp["runs"].items():
                if not run_data.get("category"):
                    raise ValueError("run %s has no category" % run_name)
        except ValueError:
            return "incomplete"
        else:
            return "ready"

    def add_experiment_type(self, etype):
        self.experiment_types.append(etype)

    def remove_experiment_type(self, etype):
        self.experiment_types.remove(etype)

    def add_run_category(self, exp_id, rcat):
        exp_data = self.experiments[exp_id]
        exp_data["run_categories"].append(rcat)

    def remove_run_category(self, exp_id, rcat):
        exp_data = self.experiments[exp_id]
        exp_data["run_categories"].remove(rcat)

    def add_experiment(self, data):
        exp_id = str(self.uid)
        self.uid += 1
        self.experiments[exp_id] = data
        return exp_id

    def update_experiment(self, exp_id, data):
        self.experiments[exp_id] = data

    def raw_file_name(self, exp_id):
        return self._full_path(self.raw_dir, "raw-%s" % exp_id)

    def cooked_file_name(self, exp_id, suffix="json"):
        return self._full_path(self.cooked_dir,
                               "cooked-%s.%s" % (exp_id, suffix))

    def _full_path(self, subdir, filename):
        import os.path, os
        dirname = os.path.join(self.base_dir, subdir)
        if not os.path.exists(dirname):
            os.mkdir(dirname)
        return os.path.join(dirname, filename)


if __name__ == "__main__":
    ds = DataStore("../../experiments")
    exp_id = "17"
    raw = ds.raw_file_name(exp_id)
    import abundance
    exp = abundance.parse_raw(raw)
    cooked = ds.cooked_file_name(exp_id)
    with open(cooked, "w") as f:
        exp.write_json(f)
