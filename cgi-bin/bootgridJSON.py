#!/usr/local/bin/python3
import json, os, cgi, enable_cgitb

def main():
    process(cgi.FieldStorage())

def process(form):
    with open(os.path.join(os.pardir, "data", "hashes.json")) as fp:
        hashes = json.load(fp)
    jsonName = hashes[form.getvalue("id")]
    with open(os.path.join(os.pardir, "data", "parsed-data", jsonName)) as fp:
        expFile = json.load(fp)
    fullData = expFile["Data"]
    print("Content-Type: application/json")
    print("")
    if "current" not in form:
        # Return 2-tuples of column (name, type) where
        # type is one of "numeric", "url", "string" or "unknown" (default)
        print(json.dumps(columns(fullData)))
    else:
        import re
        size = len(fullData[next(iter(fullData))])
        expData = reformat(fullData, size)
        # If there is a search criterion, apply it
        search = form.getvalue("searchPhrase")
        if search:
            search = search.strip()
            if search:
                expData = search_data(expData, search)
        # If there are sort criteria, apply them
        sort_order = {}
        pat = re.compile("""sort\[(.*)\]""")
        for key in form.keys():
            m = pat.match(key)
            if m is not None:
                sort_order[m.group(1)] = form.getvalue(key)
        if sort_order:
            expData = sort_data(expData, sort_order)
        # Get range of rows to return
        current = int(form.getvalue("current"))
        row_count = int(form.getvalue("rowCount"))
        # Construct and send reply
        response = {
            "total": size,
            "current": current,
            "rowCount": row_count,
            "rows": expData[current:current + row_count],
        }
        print(json.dumps(response))


def columns(data):
    from numbers import Number
    cols = []
    for name, cells in data.items():
        # Try to guess the column type
        value = cells[0]
        if value is None:
            value = cells[-1]
        if isinstance(value, Number):
            columnType = "numeric"
        elif isinstance(value, str):
            if value.startswith("http"):
                columnType = "url"
            else:
                columnType = "string"
        else:
            columnType = "unknown"
        cols.append([name, columnType])
    return sorted(cols)


def search_data(data, pat):
    return data


def sort_data(data, sort_order):
    def key(datum):
        return [datum[k] for k in sort_order]
    return sorted(data, key=key)


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
