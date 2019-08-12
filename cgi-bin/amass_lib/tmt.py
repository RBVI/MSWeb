#!/usr/bin/python3
# vim: set expandtab shiftwidth=4 softtabstop=4:
from __future__ import print_function
from pprint import pprint


"""AMaSS "tmt" experiment data, covering both tandem
mass tags (TMT) and isobaric tagging for relative
and absolute quantification (iTRAQ) experiments.

Class design is the same as that in abundance.py.
Experiment -> (input dataframe,
               [ (parameters, spectra, peptides, proteins dataframes), ... ])
The input dataframe contains the data from the original
Excel spreadsheet in pandas DataFrame form.  The list
consists of the normalized spectra, peptides and proteins
dataframes computed for a particular set of parameters
(channel->condition mapping + control condition name).
The channel names must match column names in the input
dataframe.
"""


class Experiment:

    def __init__(self, name, runs, input, normalized):
        """Create experiment from data.

        `name` - a string, typically the Excel spreadsheet file name.
        `runs` - a list of strings, column names of each channel.
        `input` - a pandas.DataFrame dictionary representation.
        `normalized` - a list of (parameters, normalized data) pairs.

        The parameters for `normalized` consist of a dictionary of
        input column names to "condition" names, and the name of the
        control condition.  The normalized data consist of three
        DataFrame instances for the normalized spectra, peptides,
        and proteins ratios (condition/control).
        
        The input and normalized data are stored as dictionaries
        generated from pandas DataFrames rather than DataFrame
        instance to minimize conversions.  When DataFrame instances
        are needed, they are created and should be cached.
        """

        self.name = name
        self.runs = runs
        self.input = input
        self._input_df = None
        self.normalized = normalized
        # Uncomment to force recomputation of all derived data
        # self.normalized = []

    def write_cooked(self, filename):
        import json
        with open(filename, "w") as f:
            data = {"name":self.name,
                    "runs":self.runs,
                    "input":self.input,
                    "normalized":self.normalized,}
            # self._find_datetime(self.input)
            json.dump(data, f)

    def _find_datetime(self, input):
        # Look for datetime instances that cannot be json-ized
        from datetime import datetime
        for key, values in input.items():
            for v in values:
                if isinstance(v, datetime):
                    print("found", v)

    def _set_input(self, df):
        self._input_df = df

    @property
    def input_df(self):
        if self._input_df is None:
            self._input_df = self.to_pandas(self.input)
        return self._input_df

    @staticmethod
    def to_python(df):
        return df.to_dict(orient="list")

    @staticmethod
    def to_pandas(data):
        from pandas import DataFrame
        return DataFrame.from_dict(data)

    @classmethod
    def parse_cooked(cls, filename):
        import json
        with open(filename) as f:
            data = json.load(f)
        from pandas import DataFrame
        name = data["name"]
        runs = data["runs"]
        input = data["input"]
        normalized = data["normalized"]
        return cls(name, runs, input, normalized)

    @classmethod
    def parse_raw(cls, name, filename):
        import pandas, re
        df = pandas.read_excel(filename, header=None)
        header_row = df.loc[df[1] == "Uniq Pep"]
        if len(header_row) == 0:
            raise ValueError("%s: no header row found" % filename)
        elif len(header_row) > 1:
            raise ValueError("%s: multiple header rows found" % filename)
        input_df = df[header_row.index[0]+1:].infer_objects()
        header_labels = list(header_row.iloc[0])
        input_df.set_axis(header_labels, axis="columns", inplace=True)
        input_df.set_axis(range(len(input_df)), axis="index", inplace=True)
        from numpy import nan
        # Sometimes gene names are mistakened as dates, e.g., SEP2
        input_df["Gene"] = input_df["Gene"].astype(str)
        input_df.rename(columns={nan:"Search ID"}, inplace=True)
        # print(len(df), "rows ->", len(input_df), "rows")
        pattern = re.compile(r"Int \d{3}")
        runs = [name for name in input_df.columns if pattern.match(name)]
        inst = cls(name, runs, cls.to_python(input_df), [])
        inst._set_input(input_df)
        return inst

    def xhr_data(self):
        return {"name":self.name,
                "runs":self.runs,
                "spectra":self.input,}

    def spectra(self, parameters, use_cache=True):
        dfs, cached = self.get_normalized(parameters)
        return dfs[0], cached

    def peptides(self, parameters, use_cache=True):
        dfs, cached = self.get_normalized(parameters)
        return dfs[1], cached

    def proteins(self, parameters, use_cache=True):
        dfs, cached = self.get_normalized(parameters)
        return dfs[2], cached

    def get_normalized(self, parameters, use_cache=True):
        if use_cache:
            for params, dfs in self.normalized:
                if self._same_params(params, parameters):
                    return dfs, True
        channel_condition = parameters["channels"]
        control_name = parameters["control"]
        dfs = [self.to_python(df)
               for df in self._normalize(channel_condition, control_name)]
        if use_cache:
            self.normalized.append((parameters, dfs))
        return dfs, False

    def _same_params(self, p1, p2):
        return p1 == p2

    def _normalize(self, channel_condition, control_name):
        prefix_corrected = "Corrected "
        prefix_ratio = "Ratio "
        prefix_log2 = "Log2 " + prefix_ratio
        prefix_mean_log2 = "Mean " + prefix_log2
        prefix_stdev_log2 = "StDev " + prefix_log2
        prefix_median_log2 = "Median " + prefix_log2

        # print("Processing spectra to proteins")
        input_df = self.input_df
        # print("  initial spectra count:", len(input_df))

        # Generate list of channels per condition,
        # list of all channels, and list of control channels
        channels = []
        condition_channels = {}
        for c, cond in channel_condition.items():
            try:
                condition_channels[cond].append(c)
            except KeyError:
                condition_channels[cond] = [c]
        channels = list(channel_condition.keys())
        controls = condition_channels[control_name]
        # print("  %d channels (%d controls), %d conditions" %
        #       (len(channels), len(controls), len(condition_channels)))

        # Remove decoys
        spectra_df = input_df[input_df["Acc #"] != "decoy"].copy()
        # print("  after removing decoys:", len(spectra_df))

        # Remove spectra that is zero in any channel
        # (We need to remove these first in case there are channels
        # where more than half the spectra have zero value and
        # end up with a zero median)
        cond = (spectra_df[channels] != 0).all(axis=1)
        spectra_df = spectra_df[cond]
        # print("  after removing zero-value-channel spectra", len(spectra_df))

        # Correct for spectra intensities by normalizing using
        # the median per channel and scaling to the largest median
        # (the scaling is only needed to generate values to compare
        # against hand-made Excel spreadsheets)
        medians = spectra_df[channels].median(axis=0)
        reference = medians.max()
        # print("  reference median", reference)
        for c in channels:
            scale = reference / medians[c]
            spectra_df[prefix_corrected + c] = spectra_df[c] * scale

        #  Remove irrelevant peptides (those that are not TMT/iTRAQ)
        re_keep = ".*(TMT|iTRAQ)[0-9]+plex.*"
        spectra_df = spectra_df[spectra_df["Peptide"].str.match(re_keep)]
        # print("  after removing non-TMT/iTRAQ spectra:", len(spectra_df))

        # Create map of peptide to proteins
        peptide_proteins = {}
        pairs = set()
        for _, row in spectra_df.iterrows():
            protein = row["Acc #"]
            peptide = row["Peptide"]
            pairs.add((protein, peptide))
            try:
                peptide_proteins[peptide].add(protein)
            except KeyError:
                peptide_proteins[peptide] = set([protein])
        # print("  unique protein-peptide pairs", len(pairs))
        # print("  distinct peptides", len(peptide_proteins))
        # print("    total proteins grouped by peptides",
        #       sum([len(proteins) for proteins in peptide_proteins.values()]))

        # Remove ambiguous peptides (those that appear in multiple proteins)
        # We keep peptides that have no associated Acc # to match
        # hand-made Excel spreadsheets
        unambiguous = [peptide for peptide, proteins in peptide_proteins.items()
                       if len(proteins) <= 1]
        # print("  unambiguous peptides", len(unambiguous))
        spectra_df = spectra_df[spectra_df["Peptide"].isin(unambiguous)]
        # spectra_df = spectra_df[spectra_df["Peptide"].isin(unambiguous)].copy()
        # print("  remaining spectra", len(spectra_df))

        # Calculate ratios of each channel to the mean value for
        # the control channels.  Also compute log2 for the ratios.
        from numpy import log2
        corrected_controls = [prefix_corrected + c for c in controls]
        control_mean = spectra_df[corrected_controls].mean(axis=1)
        for c in channels:
            ratio = spectra_df[prefix_corrected + c] / control_mean
            spectra_df[prefix_ratio + c] = ratio
            spectra_df[prefix_log2 + c] = log2(ratio)

        # Generate per-peptide data frame from per-spectra data frame.
        # Keep columns that are constant for each peptide across all spectra.
        # ("Peptide" is not kept because it is the index)
        # Then add medians for each channel ratio column.
        peptide_groups = spectra_df.groupby("Peptide")
        keep_cols = ["Acc #", "Gene", "Num Unique", "% Cov", "Best Disc Score",
                     "Best Expect Val", "DB Peptide",
                     "# in DB", "Protein MW", "Species", "Protein Name"]
        channel_prefixes = ["", prefix_corrected, prefix_ratio, prefix_log2]
        peptides_df = peptide_groups.first()[keep_cols]
        peptides_df["Spectra Count"] = peptide_groups["Acc #"].count()
        peptides_df["Peptide"] = peptides_df.index
        medians = peptide_groups.median()
        for prefix in channel_prefixes:
            for c in channels:
                col_name = prefix + c
                median_name = "Median " + col_name
                peptides_df[median_name] = medians[col_name]
        # print("  non-redundant peptides", len(peptides_df))

        # Generate per-protein table of means
        # Keep columns that are constant for each protein across all peptides.
        # Then add median and standard deviation for each channel ratio column.
        # We add the medians and stddev as two groups to make comparison to
        # hand-made Excel spreadsheet easier.
        protein_groups = peptides_df.groupby("Acc #")
        keep_cols = ["Gene", "Num Unique", "% Cov", "Best Disc Score",
                     "Best Expect Val", "Protein MW", "Species", "Protein Name"]
        proteins_df = protein_groups.first()[keep_cols]
        proteins_df["Peptides Count"] = protein_groups["Protein Name"].count()
        proteins_df["Spectra Count"] = protein_groups["Spectra Count"].sum()
        proteins_df["Acc #"] = proteins_df.index
        for c in channels:
            col_name = prefix_median_log2 + c
            median_name = prefix_median_log2 + c
            proteins_df[median_name] = protein_groups[col_name].median()
        for c in channels:
            col_name = prefix_median_log2 + c
            stdev_name = prefix_stdev_log2 + c
            proteins_df[stdev_name] = protein_groups[col_name].std()
        # print("  proteins", len(proteins_df))

        # Calculate mean and standard deviation of log2 ratios for all the
        # channels for each condition.  An additional "Corrected" mean column
        # is computed by making the median value zero.  Also apply two-tailed
        # t-test to control values vs. condition values for each protein (row).
        from scipy.stats import ttest_ind
        from numpy import log10
        control_chs = [prefix_median_log2 + c for c in controls]
        for cond, cond_chs in condition_channels.items():
            if cond == control_name:
                continue
            chs = [prefix_median_log2 + c for c in cond_chs]
            pdf = proteins_df[chs]
            mean_cond = prefix_mean_log2 + cond
            stdev_cond = prefix_stdev_log2 + cond
            means = proteins_df[mean_cond] = pdf.mean(axis=1)
            median = means.median()
            proteins_df["Corrected " + mean_cond] = means - median
            proteins_df[stdev_cond] = pdf.std(axis=1)
            if len(control_chs) > 1 and len(chs) > 1:
                def ttest_row(row):
                    return ttest_ind(row[control_chs], row[chs])
                results = proteins_df.apply(ttest_row, axis=1)
                cond_ttest = "t-statistic " + cond
                cond_pvalue = "p-value " + cond
                cond_log10_pvalue = "-log10 p-value " + cond
                proteins_df[cond_ttest], proteins_df[cond_pvalue] = zip(*results)
                proteins_df[cond_log10_pvalue] = -log10(proteins_df[cond_pvalue])

        # Done!
        return spectra_df, peptides_df, proteins_df


def parse_raw(*args):
    return Experiment.parse_raw(*args)


def parse_cooked(*args):
    return Experiment.parse_cooked(*args)


def write_xlsx(filename, spectra_df, peptides_df, proteins_df):
    import pandas
    import time
    try:
        # with pandas.ExcelWriter(fn, engine="openpyxl") as writer:
        with pandas.ExcelWriter(filename, engine="xlsxwriter") as writer:
            workbook = writer.book
            header_format = workbook.add_format({'bold': True,
                                                 'text_wrap': True})
            write_sheet(writer, spectra_df, "spectra", header_format)
            print(time.ctime(), "Generated spectra sheet")
            write_sheet(writer, peptides_df, "peptides", header_format)
            print(time.ctime(), "Generated peptides sheet")
            write_sheet(writer, proteins_df, "proteins", header_format)
            print(time.ctime(), "Generated proteins sheet")
    except ImportError as e:
        print("Cannot export spreadsheets: %s" % str(e))
        print("Spectra")
        print(spectra_df.head())
        print("Peptides")
        print(peptides_df.head())
        print("Proteins")
        print(proteins_df.head())


def write_sheet(writer, df, name, header_format):
        # spectra_df.to_excel(writer, sheet_name=name)
        df.to_excel(writer, sheet_name=name, startrow=1, header=False)
        sheet = writer.sheets[name]
        for col_num, value in enumerate(df.columns.values):
            sheet.write(0, col_num + 1, value, header_format)
        sheet.set_column(0, len(df.columns) - 1, 10)


if __name__ == "__main__":
    import os.path, time
    if False:
        datadir = "."
        init_file = "Example TMT6plex-Twiss_jan17-Cell Bodies-initial.xlsx"
        final_file = "Example TMT6plex-Twiss_jan17-Cell Bodies-final.xlsx"
        calc_file = "Cells Bodies.xlsx"
        channels = {
            "Int 126":"control",
            "Int 127":"control",
            "Int 128":"control",
            "Int 129":"Fig4",
            "Int 130":"Fig4",
            "Int 131":"Fig4",
        }
    elif False:
        datadir = "for Konrad-Twiss-axons-2017"
        init_file = "initial-axons.xlsx"
        final_file = "Axons-uniprot17-final.xlsx"
        calc_file = "Axons.xlsx"
        channels = {
            "Int 126":"control",
            "Int 127":"control",
            "Int 128":"control",
            "Int 129":"Fig4",
            "Int 130":"Fig4",
            "Int 131":"Fig4",
        }
    elif False:
        datadir = "for conrad-gigerTMT6plex2017"
        init_file = "report-giger-TMT-control126vsNogoKO129-unmod-initial.xlsx"
        final_file = "report-giger-TMT-controlvsNogoKO-unmod-final.xlsx"
        calc_file = "report-giger-TMT-control126vsNogoKO129-unmod.xlsx"
        channels = {
            "Int 126":"control",
            "Int 129":"NogoKO",
        }
    elif True:
        datadir = "KornblumNv18-for conrad"
        init_file = "unmod-initial.xlsx"
        final_file = "unmod-quant-2-to send.xlsx"
        calc_file = "unmod-quant.xlsx"
        channels = {
            "Int 114":"control",
            "Int 115":"Endocan/ESM1",
            "Int 116":"PDGFBB",
            "Int 117":"VE CM",
        }
    if not os.path.exists(os.path.join(datadir, init_file)):
        datadir = os.path.join("../../testdata", "TMT", datadir)
    cooked = "amass.cooked"
    cooked = "amass.normalized"
    params = {"channels":channels, "control":"control"}

    def test_raw():
        exp = Experiment.parse_raw(init_file, os.path.join(datadir, init_file))
        print(time.ctime(), "Read raw file", init_file)
        exp.write_cooked(cooked + '1')
        print(time.ctime(), "Wrote cooked file", cooked + '1')
        if True:
            test_processing(exp)
        exp.write_cooked(cooked + '2')
        print(time.ctime(), "Wrote normalized cooked file", cooked + '2')

    def test_processing(exp):
        print("# Normalized keys:", len(exp.normalized))
        dfs, cached = exp.get_normalized(params)
        print(time.ctime(), "Processed spectra, cached", cached)
        spectra_df, peptides_df, proteins_df = dfs
        # check_spectra(os.path.join(datadir, calc_file), spectra_df)
        if False:
            filename = "amass.xlsx"
            write_xlsx(filename, exp.to_pandas(spectra_df),
                       exp.to_pandas(peptides_df),
                       exp.to_pandas(proteins_df))
            print(time.ctime(), "Generated Excel file", filename)

    def test_cooked():
        exp = Experiment.parse_cooked(cooked + '2')
        print(time.ctime(), "Read cooked file", cooked + '2')
        if True:
            test_processing(exp)
        exp.write_cooked(cooked + '3')
        print(time.ctime(), "Wrote cooked file", cooked + '3')

    print(time.ctime(), "Start")
    test_raw()
    test_cooked()
    print(time.ctime(), "Done")
