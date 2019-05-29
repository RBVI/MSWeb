#!/usr/bin/python3
# vim: expandtab shiftwidth=4 softtabstop=4:
from __future__ import print_function


"""AMaSS "generic" experiment data.

Raw data is parsed.  Only thing end user can do is download.
"""


class Experiment:

    def __init__(self, name, runs=None):
        """Create experiment from data.
        
        `name` - a string, typically the raw data file name."""
        self.name = name
        if runs is None:
            self.runs = []
        else:
            self.runs = runs

    def write_cooked(self, filename):
        import json
        with open(filename, "w") as f:
            json.dump(self.xhr_data(), f)

    def xhr_data(self):
        return {"name":self.name,
                "runs":self.runs}


    @classmethod
    def parse_raw(cls, name, filename):
        return cls(name)


    @classmethod
    def parse_cooked(cls, filename):
        import json
        with open(filename) as f:
            data = json.load(f)
        name = data["name"]
        return cls(name)


def parse_raw(*args):
    return Experiment.parse_raw(*args)


def parse_cooked(*args):
    return Experiment.parse_cooked(*args)


if __name__ == "__main__":
    def test_parse_raw():
        import sys
        try:
            filename = sys.argv[1]
        except IndexError:
            # filename = "results-Plnx2-Sem5a-may19-sent-foruploading.xlsx"
            # filename = "brain_cortex_hippo_PSM-dataupload.xlsx"
            filename = "raw/raw-15"
            filename = "../../../production/experiments/" + filename
        exp = Experiment.parse_raw("filename", filename)
        print(exp)
        return exp
    test_parse_raw()

    def test_parse_cooked():
        exp = test_parse_raw()
        test_file = "test.json"
        exp.write_cooked(test_file)
        nexp = Experiment.parse_cooked(test_file)
        print(nexp.name)
    test_parse_cooked()
