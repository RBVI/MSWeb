#!/usr/bin/python3
# vim: set expandtab ts=4 sw=4:
from __future__ import print_function, absolute_import


normalization_methods = [
    "default",
    # "fancy",
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
        self.name = name        # string
        self.proteins = []      # list of all Protein instances
        self.runs = {}          # map of name to Run instance
        self.normalized = {}    # map of name to NormalizedAbundance instance
        self.differential = {}  # map of name to DifferentialAbundance instance

    def add_protein(self, protein):
        protein.index = len(self.proteins)
        self.proteins.append(protein)

    def add_run(self, run):
        self.runs[run.name] = run

    def write_json(self, f):
        import json
        json.dump(self.json_data(), f)

    def json_data(self):
        return {
            "name": self.name,
            "proteins": [ p.json_data() for p in self.proteins ],
            "runs": { r.name: r.json_data()
                      for r in self.runs.values() },
            "normalized": { n.name: n.json_data()
                            for n in self.normalized.values() },
            "differential": { n.norm_method: n.json_data()
                              for n in self.differential.values() },
        }

    def xhr_data(self):
        return {
            "name": self.name,
            "proteins": [ p.json_data() for p in self.proteins ],
            "runs": { r.name: r.json_data()
                      for r in self.runs.values() },
        }

    @staticmethod
    def from_json(data):
        exp = Experiment(data["name"])
        exp.proteins = [ Protein.from_json(d) for d in data["proteins"] ]
        for i, p in enumerate(exp.proteins):
            p.index = i
        exp.runs = { n: Run.from_json(d, exp.proteins)
                     for n, d in data["runs"].items() }
        if "normalized" in data:
            exp.normalized = { n: NormalizedAbundance.from_json(d, exp.proteins)
                               for n, d in data["normalized"].items() }
        if "differential" in data:
            exp.differential = { n: DifferentialAbundance.from_json(d)
                                 for n, d in data["differential"].items() }
        return exp

    def normalize(self, metadata, method, params):
        try:
            return self._find_norm(method, params), True
        except KeyError:
            pass
        if method == "default":
            norm = self.normalize_default(metadata)
            return norm, False
        raise ValueError("unsupported normalization method: %s" % method)

    def _find_norm(self, method, params):
        norm = self.normalized[method]
        if params and norm.params != params:
            raise KeyError("mismatched parameters")
        return norm

    def normalize_default(self, metadata):
        #
        # Find maximum sum of peptide counts per run.
        # It will be used to scale run counts later.
        #
        run_total = {}
        for run in self.runs.values():
            run_total[run] = sum([stat.peptide_count
                                  for stat in run.protein_stats.values()])
        max_total = float(max(run_total.values()))
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
        stats = {}
        for cat_name, category in cat_counts.items():
            cat_stats = stats[cat_name] = {}
            for protein in self.proteins:
                try:
                    counts = numpy.array(category[protein])
                except KeyError:
                    pass
                else:
                    mean = numpy.mean(counts)
                    sd = numpy.std(counts)
                    cat_stats[protein] = (mean, sd, len(counts))
        norm = NormalizedAbundance("default", {}, stats)
        self.normalized["default"] = norm
        return norm

    def differential_abundance(self, metadata, norm_method, norm_params,
                               categories, control, fc_cutoff, mean_cutoff):
        params = {"norm_params": norm_params,
                  "categories": list(sorted(categories)),
                  "control": control,
                  "fc_cutoff": fc_cutoff,
                  "mean_cutoff": mean_cutoff}
        try:
            return self._find_diff_abundance(norm_method, params), True
        except KeyError:
            pass
        norm, cached = self.normalize(metadata, norm_method, norm_params)
        df = norm.pandas_dataframe(self.proteins, categories)
        try:
            from .diff_abundance import calc_diff_abundance
        except ImportError:
            from diff_abundance import calc_diff_abundance
        pda = calc_diff_abundance(df, categories, control,
                                  fc_cutoff, mean_cutoff)
        da = DifferentialAbundance(norm_method, params, pda)
        self.differential[norm_method] = da
        return da, False

    def _find_diff_abundance(self, norm_method, params):
        da = self.differential[norm_method]
        if params != da.params:
            raise KeyError("mismatched parameters")
        return da


class NormalizedAbundance:
    """Normalized abundance values by category.

    Each category is a map from protein to (mean, sd, count)."""

    def __init__(self, name, params, stats):
        self.name = name
        self.params = params
        self.stats = stats

    def json_data(self):
        """Returns normalized stats, replacing Protein instances by indices."""

        json_stats = {}
        for cat_name, category in self.stats.items():
            index_data = json_stats[cat_name] = {}
            for protein, protein_stats in category.items():
                index_data[protein.index] = protein_stats
        return {"name":self.name, "params":self.params, "stats":json_stats}

    def pandas_dataframe(self, proteins, categories):
        # Return pandas data frame intended for use with
        # differential abundance calculation.  Data frame
        # always has "Rows" column corresponding to the given
        # protein indices.  Each given category generates three
        # additional columns: "<category_name> Mean",
        # "<category_name> SD" and "<category_name> Count".
        import pandas, numpy
        df = {"Rows": pandas.Categorical([p.index for p in proteins])}
        for cat_name in categories:
            category = self.stats[cat_name]
            mean = []
            sd = []
            count = []
            default_stats = (numpy.nan, numpy.nan, numpy.nan)
            for p in proteins:
                protein_stats = category.get(p, default_stats)
                mean.append(protein_stats[0])
                sd.append(protein_stats[1])
                count.append(protein_stats[2])
            df[cat_name + " Mean"] = mean
            df[cat_name + " SD"] = sd
            df[cat_name + " Count"] = count
        return pandas.DataFrame(df)

    @staticmethod
    def from_json(data, proteins):
        stats = {}
        for cat_name, category in data["stats"].items():
            protein_data = stats[cat_name] = {}
            for n, protein_stats in category.items():
                protein_data[proteins[int(n)]] = protein_stats
        return NormalizedAbundance(data["name"], data["params"], stats)


class DifferentialAbundance:
    """Differential abundance of proteins."""

    def __init__(self, norm_method, params, dataframe):
        self.norm_method = norm_method
        self.params = params
        self.dataframe = dataframe

    def json_data(self):
        return {"norm_method":self.norm_method,
                "params":self.params,
                "dataframe":self.dataframe.to_dict()}

    def xhr_data(self):
        # Return data for AJAX request
        return {"norm_method":self.norm_method,
                "params":self.params,
                "stats":self.dataframe.to_dict(orient="split")}

    @staticmethod
    def from_json(data):
        from pandas import DataFrame
        return DifferentialAbundance(data["norm_method"], data["params"],
                                     DataFrame.from_dict(data["dataframe"]))


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

    def json_data(self):
        return {
            "name": self.name,
            "protein_stats": { p.index: s.json_data()
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
        cooked = ds.cooked_file_name(exp_id)
        exp = parse_cooked(cooked)
        # norm = exp.normalize_default(metadata)
        cat_list = ["control", "L1", "L2", "L3", "L4", "L5" ]
        da, cached = exp.differential_abundance(metadata, "default", {},
                                                cat_list, "control", 1.0, 0.0)
        print(cached)
        print(da)
        print(da.xhr_data())
    test_abundance()
