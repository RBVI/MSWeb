#!/usr/bin/python3
# vim: set expandtab ts=4 sw=4:
from __future__ import print_function

"""MSWeb experiment data.

An experiment consists of a list of proteins and a series of runs.
A run consists of a list of proteins and their coverage statistics.
"""


class Experiment:

    def __init__(self, name):
        self.name = name
        self.protein_list = []      # all proteins
        self.proteins = {}          # non-decoy proteins
        self.runs = {}

    def add_protein(self, protein):
        self.protein_list.append(protein)
        if protein.accession != "decoy":
            self.proteins[protein.name] = protein

    def add_run(self, run):
        self.runs[run.name] = run

    def write_json(self, f):
        # TODO: more here
        pass


class Protein:

    def __init__(self, data):
        self.rank = data["Rank"]
        self.unique_peptides = data["Uniq Pep"]
        self.accession = data["Acc #"]
        self.gene = data["Gene"]
        self.molecular_weight = data["Protein MW"]
        self.species = data["Species"]
        self.name = data["Protein Name"]


class Run:

    def __init__(self, name):
        self.name = name
        self.proteins = {}

    def add_protein(self, protein, stats):
        self.proteins[protein] = stats


class Stats:

    def __init__(self, data):
        self.unique_peptides = data["Num Unique"]
        self.peptide_count = data["Peptide Count"]
        self.coverage = data["% Cov"]
        self.best_score = data["Best Disc Score"]
        self.best_expected = data["Best Expect Val"]
