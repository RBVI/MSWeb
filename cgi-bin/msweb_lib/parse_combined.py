#!/usr/bin/python2
# vim: set expandtab ts=4 sw=4:
from __future__ import print_function


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

    data = parse_combined(input_name, verbose=verbose)
    print(data)


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


def parse_combined(filename, metadata={}, verbose=0):
    from msweb import Experiment, Protein, Run, Stats
    import xlrd
    exp = Experiment(filename, metadata)
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
                run.add_protein(protein, Stats(run_stats))
            row_index += 1
        if verbose:
            print("%d proteins found" % len(exp.proteins))

    return exp


if __name__ == "__main__":
    main()
