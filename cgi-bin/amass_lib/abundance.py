#!/usr/bin/python3
# vim: expandtab shiftwidth=4 softtabstop=4:
from __future__ import print_function


"""AMaSS "abundance" experiment data.

An experiment consists of a list of runs and a pandas DataFrame
with rows corresponding to proteins, and columns to protein properties.
Standard protein properties are in ProteinProperties.  Per-experiment
properties are generated from the run name using run_column()
and there should be one "Peptide Count"/"PSMs" column for each run,
as well as a single "Count Total" column that is the sum of all
the per-run count columns.
"""


class Experiment:

    ProteinProperties = {"Rank":str,
                         "Uniq Pep":int,
                         "Acc #":str,
                         "Gene":str,
                         "Num Unique":int,
                         "% Cov":float,
                         "Best Expect Val":float,
                         "Protein MW":float,
                         "Species":str,
                         "Protein Name":str,}

    def __init__(self, name, runs, proteins,
                 normalized_counts, differential_abundance):
        """Create experiment from data.
        
        `name` - a string, typically the Excel spreadsheet file name.
        `runs` - a list of run names.
        `proteins` - a pandas.DataFrame.
        `normalized_counts` - a list of (parameters, stats) where
             `params` is a dictionary and `stats` is a
             pandas.DataFrame.to_dict() dictionary.
        `differential abundance` - a list of (parameters, stats) where
             `params` is a dictionary and `stats` is a
             pandas.DataFrame.to_dict() dictionary."""

        self.name = name
        self.runs = runs
        self.proteins = proteins
        self.cache_nc = normalized_counts
        self.cache_da = differential_abundance

    def write_cooked(self, filename):
        import json
        with open(filename, "w") as f:
            json.dump(self.xhr_data(), f)

    def xhr_data(self):
        return {"name":self.name,
                "runs":self.runs,
                "proteins":self.proteins.to_dict(orient="list"),
                "normalized_counts":self.cache_nc,
                "differential_abundance":self.cache_da,}

    def normalized_counts(self, md, params, use_cache=True):
        if use_cache:
            for nc_params, nc_stats in self.cache_nc:
                if params == nc_params:
                    import pandas
                    return pandas.DataFrame.from_dict(nc_stats), True
        df = NormalizedCounts.compute(md, self, params)
        if use_cache:
            self.cache_nc.append((params, df.to_dict(orient="list")))
        return df, False

    def xhr_nc(self, df):
        return df.to_dict(orient="list")

    def differential_abundance(self, md, params, use_cache=True):
        if use_cache:
            for da_params, da_stats in self.cache_da:
                if params == da_params:
                    import pandas
                    return pandas.DataFrame.from_dict(da_stats), True
        df = DifferentialAbundance.compute(md, self, params)
        if use_cache:
            self.cache_da.append((params, df.to_dict(orient="list")))
        return df, False

    def xhr_da(self, df):
        return df.to_dict(orient="list")


    @classmethod
    def parse_raw(cls, name, filename):
        import pandas

        # Read the spreadsheet to find the label row
        # TODO: if performance is important, hand-roll a parser using xlrd
        # that returns immediately when it sees the label row instead
        # of reading the whole sheet
        df = pandas.read_excel(filename, header=None,
                               converters=cls.ProteinProperties)
        num_rows, num_cols = df.shape
        label_row = None
        for i in range(num_rows):
            try:
                if df[0][i].lower() == "rank":
                    label_row = i
                    break
            except AttributeError:
                # NaN, numbers, etc. do not have lower() attribute
                pass

        # Pull the experiment names from the first column, skipping empty cells
        runs = df[0][:label_row].dropna()

        # Read the spreadsheet again to get the actual abundance data
        df = pandas.read_excel(filename, skiprows=label_row,
                               converters=cls.ProteinProperties)

        # Make sure that we have the standard expected columns
        # All column name comparisons should be done in lowercase 
        lc_map = {s.lower():s for s in cls.ProteinProperties}
        found = set()
        rename_map = {}
        for col_name in df.columns:
            try:
                canonical_name = lc_map[col_name.lower()]
            except KeyError:
                pass
            else:
                found.add(canonical_name)
                if col_name != canonical_name:
                    rename_map[col_name] = canonical_name
        missing = set(cls.ProteinProperties.keys()) - found
        if missing:
            raise KeyError("Missing columns: %s" % ", ".join(missing))

        # Make sure we have the right number of "count" columns
        count_cols = set(df.columns) - set(cls.ProteinProperties.keys())
        if len(count_cols) != len(runs) + 1:
            raise ValueError("expected %d count columns and got %d" %
                             (len(runs) + 1, len(count_cols)))
        count_names = {"peptide count":"peptide count",
                       "psms":"psm"}
        num_std_cols = len(cls.ProteinProperties) + 1
        for i, col_name in enumerate(df.columns[:num_std_cols]):
            try:
                count_prefix = count_names[col_name.lower()]
                rename_map[col_name] = "Count Total"
                break
            except KeyError:
                pass
        else:
            raise KeyError('Missing column: "Peptide Count" or "PSMs"')
        unexpected = []
        for i, col_name in enumerate(df.columns[num_std_cols:]):
            if not col_name.lower().startswith(count_prefix):
                unexpected.append(col_name)
            else:
                rename_map[col_name] = run_column(runs[i])
        if len(unexpected) > 0:
            raise KeyError("Unexpected columns: %s" % ", ".join(unexpected))
        df.rename(rename_map, axis="columns", inplace=True)

        return cls(name, list(runs), df, [], [])


    @classmethod
    def parse_cooked(cls, filename):
        import json
        with open(filename) as f:
            data = json.load(f)

        from pandas import DataFrame
        name = data["name"]
        runs = data["runs"]
        df = DataFrame.from_dict(data["proteins"])
        normalized_counts = data["normalized_counts"]
        differential_abundance = data["differential_abundance"]

        return cls(name, list(runs), df,
                   normalized_counts, differential_abundance)


class _BaseComputation:

    @classmethod
    def methods(cls):
        return [name[len(cls._Prefix):] for name in dir(cls)
                if name.startswith(cls._Prefix)]

    @classmethod
    def compute(cls, md, exp, params):
        f = getattr(cls, cls._Prefix + params["method"])
        return f(md, exp, params)


class NormalizedCounts(_BaseComputation):
    """Normalized counts stats by category.

    Returns pandas.DataFrame.to_dict() dictionary where rows
    match proteins in experiment, and there are three columns
    per category in metadata: (mean, sd, count).  Columns are
    "Mean", "SD" and "Count", prefixed by their category names."""

    _Prefix = "nc_"

    @classmethod
    def nc_default(cls, md, exp, params):
        #
        # Find maximum sum of peptide counts per run.
        # It will be used to scale run counts later.
        #
        run_counts = exp.proteins.filter([run_column(run) for run in exp.runs])
        run_total = run_counts.sum(axis=0)
        max_total = run_total.max()
        #
        # Create map from category to run names
        #
        cat2runs = {}
        for run, run_md in md["runs"].items():
            cat = run_md["category"]
            col_name = run_column(run)
            try:
                cat2runs[cat].append(col_name)
            except KeyError:
                cat2runs[cat] = [col_name]
        #
        # Compute per-category dictionary of normalized
        # counts for each protein
        #
        cat_counts = {}
        for cat, runs in cat2runs.items():
            columns = exp.proteins.filter(runs)
            for run in runs:
                scale = max_total / run_total[run]
                columns[run] *= scale
            cat_counts[cat_column(cat, "Mean")] = columns.mean(axis=1)
            cat_counts[cat_column(cat, "SD")] = columns.std(axis=1)
            cat_counts[cat_column(cat, "Count")] = columns.count(axis=1)

        import pandas
        return pandas.DataFrame(cat_counts)


class DifferentialAbundance(_BaseComputation):
    """Normalized counts stats by category.

    Returns pandas.DataFrame.to_dict() dictionary where rows
    match proteins in experiment, and there are three columns
    per category in metadata: (mean, sd, count).  Columns are
    "Mean", "SD" and "Count", prefixed by their category names."""

    _Prefix = "da_"

    @classmethod
    def da_default(cls, md, exp, params):
        nc_params = {name[3:]:value for name, value in params.items()
                     if name.startswith("nc_")}
        nc_df, cached = exp.normalized_counts(md, nc_params)
        nc_df["Rows"] = nc_df.index
        try:
            from .diff_abundance import calc_diff_abundance
        except ImportError:
            # Test code below cannot use relative import
            from diff_abundance import calc_diff_abundance
        da_df = calc_diff_abundance(nc_df, params["categories"],
                                    params["control"], params["fc_cutoff"],
                                    params["mean_cutoff"])
        return da_df



def run_column(run):
    """Return run column name in Experiments.proteins."""
    return "%s Count" % run


def cat_column(cat, which):
    """Return category column name in NormalizedCounts."""
    return "%s %s" % (cat, which)


def parse_raw(*args):
    return Experiment.parse_raw(*args)


def parse_cooked(*args):
    return Experiment.parse_cooked(*args)


def normalization_methods():
    return NormalizedCounts.methods()


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
        print(exp.runs)
        # print(exp.proteins)
        print(exp.proteins.dtypes)
        return exp
    test_parse_raw()

    def test_parse_cooked():
        exp = test_parse_raw()
        test_file = "test.json"
        exp.write_cooked(test_file)
        nexp = Experiment.parse_cooked(test_file)
        print(nexp.proteins)
    # test_parse_cooked()

    def test_normalized_counts():
        from datastore import DataStore
        ds = DataStore("../../experiments")
        exp_id = "1"
        metadata = ds.experiments[exp_id]
        cooked = ds.cooked_file_name(exp_id)
        exp = parse_cooked(cooked)
        params = {
            "method":"default",
        }
        nc, cached = exp.normalized_counts(metadata, params)
        print(cached)
        print(nc)
    # test_normalized_counts()

    def test_differential_abundance():
        from datastore import DataStore
        ds = DataStore("../../experiments")
        exp_id = "8"
        metadata = ds.experiments[exp_id]
        cooked = ds.cooked_file_name(exp_id)
        exp = parse_cooked(cooked)
        params = {
            "nc_method":"default",
            "method":"default",
            "categories":[
                "control cortex-contralateral 24h",
                "control cortex-contralateral 48h",
                "control cortex-ipsilateral 24h",
                "control cortex-ipsilateral 48h",
                "control hypothalamus-contralateral 24h",
                "control hypothalamus-contralateral 48h",
                "control hypothalamus-ipsilateral 24h",
                "control hypothalamus-ipsilateral 48h",
                "shame-cortex-contralateral 24h",
                "shame-cortex-ipsilateral 24h",
                "shame-hypothalamus-contralateral 24h",
                "shame-hypothalamus-ipsilateral 24h",
                "treatment-cortex-contralateral 24h",
                "treatment-cortex-ipsilateral 24h",
                "treatment-hypothalamus-contralateral 24h",
                "treatment-hypothalamus-ipsilateral 24h",
            ],
            "control":"control cortex-contralateral 48h",
            "fc_cutoff":1,
            "mean_cutoff":0,
        }
        da, cached = exp.differential_abundance(metadata, params, use_cache=False)
        print(cached)
        print(exp.xhr_da(da))
    # test_differential_abundance()
