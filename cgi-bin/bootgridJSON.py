#!/usr/local/bin/python3
import json, os, cgi, enable_cgitb

def main():
    process(cgi.FieldStorage())

def process(form):
    with open(os.path.join(os.pardir, "data", "hashes.json")) as fp:
        hashes = json.load(fp)
    hash = hashes[form.getvalue("id")]
    with open(os.path.join(os.pardir, "data", "parsed-data", hash)) as fp:
        exp_file = json.load(fp)
    full_data = exp_file["Data"]
    print("Content-Type: application/json")
    print("")
    if "current" not in form:
        # Return 2-tuples of column (name, type) where
        # type is one of "numeric", "url", "string" or "unknown" (default)
        print(json.dumps(columns(full_data)))
    else:
        import re
        size = len(full_data[next(iter(full_data))])
        exp_data = reformat(full_data, size)
        # If there is a search criterion, apply it
        search = form.getvalue("searchPhrase")
        if search:
            search = search.strip()
            if search:
                exp_data = search_data(exp_data, search)
        # If there are sort criteria, apply them
        sort_by = None
        sort_order = None
        pat = re.compile("""sort\[(.*)\]""")
        for key in form.keys():
            m = pat.match(key)
            if m is not None:
                sort_by = m.group(1)
                sort_order = form.getvalue(key)
        if sort_order:
            if guess_type(full_data[sort_by]) == "numeric":
                converter = float
            else:
                converter = None
            exp_data = sort_data(exp_data, sort_by, sort_order, converter)
        # Get range of rows to return
        current = int(form.getvalue("current"))
        row_count = int(form.getvalue("rowCount"))
        # Construct and send reply
        response = {
            "total": size,
            "current": current,
            "rowCount": row_count,
            "rows": exp_data[current:current + row_count],
        }
        print(json.dumps(response))


def columns(full_data):
    cols = []
    for name, cells in full_data.items():
        # Try to guess the column type
        column_type = guess_type(cells)
        cols.append([name, column_type])
    return sorted(cols)


def guess_type(cells):
    mid = len(cells) // 2
    indices = [0, mid, -1]
    try:
        for n in indices:
            float(cells[n])
    except ValueError:
        pass
    else:
        return "numeric"
    count = sum([1 if cells[n].startswith("http") else 0 for n in indices])
    if count > len(indices) - 1:
        return "url"
    return "string"


def search_data(data, pat):
    return data


def sort_data(data, sort_by, sort_order, converter):
    if converter:
        def key(datum):
            return converter(datum[sort_by])
    else:
        def key(datum):
            return datum[sort_by]
    return sorted(data, key=key, reverse=(sort_order == "desc"))


def reformat(data, size):
    new_data = []
    for i in range(size):
        new_data.append({})
    for k in data.keys():
        for n, value in enumerate(data[k]):
            new_data[n][k] = value
    return new_data


if __name__ == "__main__":
    import os
    if "REQUEST_URI" in os.environ:
        main()
    else:
        import json
        with open(os.path.join(os.pardir, "data", "hashes.json")) as fp:
            hashes = json.load(fp)
        inv = {name:hash for hash, name in hashes.items()}
        from io import BytesIO
        from urllib.parse import urlencode
        os.environ["REQUEST_METHOD"] = "POST"
    
        data = urlencode({"id": inv["phosphoMSViewerDataset.json"],
                          "current": 1,
                          "rowCount": 2,
                          "sort[Acc #]": "asc",
                          })
        f = BytesIO(data.encode("utf-8"))
        form = cgi.FieldStorage(f)
        process(form)
