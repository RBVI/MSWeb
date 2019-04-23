#!/usr/bin/python2
# vim: set expandtab ts=4 sw=4:
from __future__ import print_function


normalization_methods = [
    "default",
    "fancy",
]


def parse_raw(filename, verbose=0):
    import xlrd
    exp = Experiment(filename)
    with xlrd.open_workbook(filename) as wb:
        # There should only be one worksheet
        if wb.nsheets != 1:
            raise ValueError("Expected one worksheet and found %d" % wb.nsheets)
        sh = wb.sheet_by_index(0)
        if verbose:
            print("Worksheet: %s (%d rows x %d columns)" % (
                  sh.name, sh.nrows, sh.ncols))

        # Worksheet starts with rows with
        #   column 0 = "Search Name:"
        #   column 1 = name of run
        row_index = 0
        while sh.cell_value(rowx=row_index, colx=0).startswith("Search Name"):
            name = sh.cell_value(rowx=row_index, colx=1)
            if verbose > 1:
                print("Search name:", name)
            exp.add_run(Run(name))
            row_index += 1
        if verbose > 1:
            print("%d search names listed" % len(exp.runs))

        # Next row has some blank columns, followed by
        # sets of five columns (with first column in set
        # being a search name), followed by some more
        # blank columns
        col_index = 0
        pre_columns = 0
        post_columns = 0
        search_name_columns = [         # Expected columns per search name
            "Num Unique",
            "Peptide Count",
            "% Cov",
            "Best Disc Score",
            "Best Expect Val",
        ]
        search_name_bases = {}
        while col_index < sh.ncols:     # Get first set of peptide columns
            name = sh.cell_value(rowx=row_index, colx=col_index).strip()
            if name:
                pre_columns = col_index
                break
            col_index += 1
        while col_index < sh.ncols:
            name = sh.cell_value(rowx=row_index, colx=col_index).strip()
            if not name:                # Must have finished all the names
                post_columns = sh.ncols - col_index
                break
            else:
                try:
                    run = exp.runs[name]
                except KeyError:
                    raise ValueError("Search name title %r found, "
                                     "but not listed initially" % name)
                search_name_bases[name] = col_index
                for i in range(len(search_name_columns)-1):
                    col_index += 1
                    v = sh.cell_value(rowx=row_index, colx=col_index).strip()
                    if v:
                        raise ValueError("Unexpected title in search name list")
                col_index += 1
        row_index += 1
        if verbose:
            print("%d titles found for search names" % len(search_name_bases))
        if verbose > 1:
            print("%d columns before, %d columns after" %
                  (pre_columns, post_columns))

        # Next row has the column titles for the peptides
        # in subsequent rows.  There should be titles matching
        # the leading blank columns on the previous line,
        # followed by sets of five columns for each search
        # name, followed by titles matching blank columns
        # at the end.
        column_titles = {}
        for i in range(pre_columns):
            title = sh.cell_value(rowx=row_index, colx=i).strip()
            column_titles[i] = title
        for i in range(len(search_name_bases)):
            col_base = pre_columns + i * len(search_name_columns)
            for j, expected in enumerate(search_name_columns):
                col_index = col_base + j
                title = sh.cell_value(rowx=row_index, colx=col_index).strip()
                if title != expected:
                    raise ValueError("Expected title %r and got %r" %
                                     (expected, title))
        start = pre_columns + len(search_name_columns) * len(search_name_bases)
        for i in range(start, start + post_columns):
            title = sh.cell_value(rowx=row_index, colx=i).strip()
            column_titles[i] = title
        if verbose > 1:
            for col_index in sorted(column_titles.keys()):
                print("Column %d: %s" % (col_index, column_titles[col_index]))
        row_index += 1

        # The rest of the rows are peptide rows where the first pre-column
        # should not be empty.  We keep all values as strings unless we
        # recognize the title.
        while row_index < sh.nrows:
            values = {}
            for col_index, title in column_titles.items():
                values[title] = sh.cell_value(rowx=row_index, colx=col_index)
            protein = Protein(values)
            exp.add_protein(protein)
            for name, base in search_name_bases.items():
                v = sh.cell_value(rowx=row_index, colx=base)
                if not v:
                    continue
                run = exp.runs[name]
                run_stats = {}
                for offset, title in enumerate(search_name_columns):
                    v = sh.cell_value(rowx=row_index, colx=base+offset)
                    run_stats[title] = v
                run.add_protein_stats(protein, Stats(run_stats))
            row_index += 1
        if verbose:
            print("%d proteins found" % len(exp.proteins))

    return exp


def parse_cooked(filename):
    import json
    with open(filename) as f:
        data = json.load(f)
    return Experiment.from_json(data)


def parse_int(s):
    try:
        return int(s)
    except ValueError:
        return 0


def parse_float(s):
    try:
        return float(s)
    except ValueError:
        return 0.0


def parse_percentage(s):
    return parse_float(s) / 100.0


"""MSWeb "abundance" experiment data.

An experiment consists of a list of proteins and a series of runs.
A run consists of a list of proteins and their coverage statistics.
"""


class Experiment:

    def __init__(self, name):
        self.name = name
        self.proteins = []      # all proteins
        self.runs = {}

    def add_protein(self, protein):
        self.proteins.append(protein)

    def add_run(self, run):
        self.runs[run.name] = run

    def write_json(self, f):
        import json
        json.dump(self.json_data(), f)

    def json_data(self):
        protein_index = { p: i for i, p in enumerate(self.proteins) }
        return {
            "name": self.name,
            "proteins": [ p.json_data() for p in self.proteins ],
            "runs": { r.name: r.json_data(protein_index)
                      for r in self.runs.values() },
        }

    @staticmethod
    def from_json(data):
        exp = Experiment(data["name"])
        exp.proteins = [ Protein.from_json(d) for d in data["proteins"] ]
        exp.runs = { n: Run.from_json(d, exp.proteins)
                     for n, d in data["runs"].items() }
        return exp

    def normalize_counts(self, metadata):
        #
        # Find maximum sum of peptide counts per run.
        # It will be used to scale run counts later.
        #
        run_total = {}
        for run in self.runs.values():
            run_total[run] = sum([stat.peptide_count
                                  for stat in run.protein_stats.values()])
        max_total = float(max(run_total.values()))
        print("max_total", max_total)
        #
        # Create map from run to category name
        #
        run2cat = {}
        for run_name, run_data in metadata["runs"].items():
            run2cat[run_name] = run_data["category"]
        #
        # Compute per-category dictionary of normalized
        # counts for each protein
        #
        cat_counts = {}
        for run_name, run in self.runs.items():
            scale = max_total / run_total[run]
            cat_name = run2cat[run.name]
            try:
                category = cat_counts[cat_name]
            except KeyError:
                category = cat_counts[cat_name] = {}
            for protein, stat in run.protein_stats.items():
                norm_count = stat.peptide_count * scale
                try:
                    category[protein].append(norm_count)
                except KeyError:
                    category[protein] = [norm_count]
        #
        # Compute per-protein dictionary of per-category
        # mean, standard deviation and count
        #
        import numpy
        proteins = set()
        for category in cat_counts.values():
            proteins.update(category.keys())
        summary = {}
        for protein in proteins:
            summary[protein] = protein_summary = {}
            for cat_name, category in cat_counts.items():
                try:
                    counts = numpy.array(category[protein])
                except KeyError:
                    continue
                mean = numpy.mean(counts)
                sd = numpy.std(counts)
                protein_summary[cat_name] = (mean, sd, len(counts))
        return summary


class _AttrLabelStore:
    """Base class for storing dictionary as instance attributes.

    Derived classes must define the "AttrLabelMap" class dictionary
    whose keys are instance attribute names and values are string
    label keys from raw data dictionaries."""

    def __init__(self, data):
        for attr, label in self.AttrLabelMap.items():
            setattr(self, attr, data[label])

    def json_data(self):
        return { label: getattr(self, attr)
                 for attr, label in self.AttrLabelMap.items() }

    @classmethod
    def from_json(cls, data):
        return cls(data)


class Protein(_AttrLabelStore):

    AttrLabelMap = {
        "rank": "Rank",
        "unique_peptides": "Uniq Pep",
        "accession": "Acc #",
        "gene": "Gene",
        "molecular_weight": "Protein MW",
        "species": "Species",
        "name": "Protein Name",
    }


class Run:

    def __init__(self, name):
        self.name = name
        self.protein_stats = {}

    def add_protein_stats(self, protein, stats):
        self.protein_stats[protein] = stats

    def json_data(self, index_map):
        return {
            "name": self.name,
            "protein_stats": { index_map[p]: s.json_data()
                               for p, s in self.protein_stats.items() },
        }

    @staticmethod
    def from_json(data, proteins):
        r = Run(data["name"])
        for n, d in data["protein_stats"].items():
            r.protein_stats[proteins[int(n)]] = Stats.from_json(d)
        return r


class Stats(_AttrLabelStore):

    AttrLabelMap = {
        "unique_peptides": "Num Unique",
        "peptide_count": "Peptide Count",
        "coverage": "% Cov",
        "best_score": "Best Disc Score",
        "best_expected": "Best Expect Val",
    }


if __name__ == "__main__":

    def main():
        import sys, getopt
        verbose = 0
        opts, args = getopt.getopt(sys.argv[1:], "v")
        for opt, val in opts:
            if opt == "-v":
                verbose += 1
        if len(args) == 1:
            input_name = args[0]
            output_name = None
        elif len(args) == 2:
            input_name = args[0]
            output_name = args[1]
        else:
            print("Usage: %s [-v] excel_file [json_file]" % sys.argv[0],
                  file=sys.stderr)
            raise SystemExit(1)

        exp = parse_raw(input_name, verbose=verbose)
        print(exp)
        json_data = exp.json_data()
        exp2 = Experiment.from_json(json_data)
        print(exp2)
    # main()

    def test_abundance():
        from datastore import DataStore
        ds = DataStore("../../experiments")
        exp_id = "17"
        metadata = ds.experiments[exp_id]
        exp = parse_cooked(ds.cooked_file_name(exp_id))
        print(exp.normalize_counts(metadata))
    test_abundance()
