#!/usr/bin/python3
# coding: utf-8
# vim: set expandtab ts=4 sw=4:

import numpy as np
import pandas as pd
import scipy.stats as stats
# import statsmodels.api as sm
import statsmodels.stats.multitest as multitest
import math

# Read the data in as a panda using the panda JSON format
# Data format should be mean, sd, and num of each category


# Calculate the log fold change between the control/normal and each category
# For each gene, calculate the p-value and adjusted p-value using Benjamini-Hochberg
#
# Arguments:
#   mean_abundance_table -- a pandas DataFrame with a Rows array for the row labels and a series
#                           of three columns for each category.  If the category is "Healthy" then the
#                           three columns would be "Healthy Mean", "Healthy SD", and "Healthy Count"
#   catList -- a list of the category names
#   controlColumn -- the name of the column to count as the control column.  Differential will be calculated
#                    based on this column
#   fc_cutoff -- the minimum Log2FC to consider for calculating the pValues
#   mean_cutoff -- the minimum mean to consider for calculating the pValues
#
# Return:
#   a new pandas object with the original 'Rows' column and three columns for each category.  If the category is "Healthy"
#         then the three columns would be "Healthy log2FC", "Healthy pValue", "Healthy fdr"
#
def calc_diff_abundance(mean_abundance_table, catList, controlColumn='Control', fc_cutoff=1.0, mean_cutoff=0.0):

    # Get the information for our control/normal
    control = mean_abundance_table[controlColumn+' Mean']
    control_sd = mean_abundance_table[controlColumn+' SD']
    control_count = mean_abundance_table[controlColumn+' Count']

    # Create a new data frame for our data
    diff_exp = pd.DataFrame()
    diff_exp['Rows'] = mean_abundance_table['Rows']

    controlLog2 = np.log(control)/np.log(2)
    controlLog2[controlLog2 == np.inf] = np.nan
    controlLog2[controlLog2 == -np.inf] = np.nan

    for cat in catList:
        if cat == controlColumn:
            continue

        # Get copies because we're going to filter things
        cond = mean_abundance_table[cat+' Mean']
        cond_sd = mean_abundance_table[cat+' SD']
        cond_count = mean_abundance_table[cat+' Count']

        condLog2 = np.log(cond)/np.log(2)
        condLog2[condLog2 == np.inf] = np.nan
        condLog2[condLog2 == -np.inf] = np.nan

        log2FC = condLog2-controlLog2

        diff_exp[cat+' log2FC'] = log2FC

        rows = filter(log2FC, control, control_count, cond, cond_sd, cond_count, fc_cutoff, mean_cutoff)
        if not rows:
            continue

        # print(rows)
        ttest = stats.ttest_ind_from_stats(control.iloc[rows], control_sd.iloc[rows], control_count.iloc[rows],
                                           cond.iloc[rows], cond_sd.iloc[rows], cond_count.iloc[rows])

        # print(ttest.pvalue)
        # Finally, calculate the benjamini-hochberg
        corrected = multitest.multipletests(ttest.pvalue, method='fdr_bh')


        # Now, get the values into the right slots and return the new table
        pv = [np.nan for i in range(cond.size)]
        fdr = [np.nan for i in range(cond.size)]

        i = 0
        for index in rows:
            pv[index] = ttest.pvalue[i]
            fdr[index] = corrected[1][i]
            i += 1
        diff_exp[cat+' pValue'] = pv
        diff_exp[cat+' fdr'] = fdr


    return diff_exp

#
# Filter the data using the provided cutoffs
# This returns an array of indices into the original data for the points that pass
# our cutoffs
def filter(log2FC, control, control_count, cond, cond_sd, cond_count, fc_cutoff=1.0, mean_cutoff=0.0):
    index = []
    for i in range(0,cond.size):
        if np.isnan(cond[i]) or np.isnan(control[i]) or np.isnan(log2FC[i]) or \
           control[i] < mean_cutoff or cond[i] < mean_cutoff or math.fabs(log2FC[i])<fc_cutoff or \
           cond_count[i] < 2 or control_count[i] < 2:
            pass
        else:
            index.append(i)

    return index


# Main -- just used for testing
if __name__ == "__main__":
    # Test
    catList = ["Control","Cond 1"]

    cats = pd.DataFrame({'Rows':pd.Categorical(["A", "B", "C", "D"]), 
                         'Control Mean':pd.Series([1.0,0.5,10.0,1]),
                         'Control SD':pd.Series([1.1,1.3,10,5]),
                         'Control Count':pd.Series([3,3,3,3]),
                         'Cond 1 Mean':pd.Series([8.1,7.3,2,np.nan]),
                         'Cond 1 SD':pd.Series([1.1,1.3,10,5]),
                         'Cond 1 Count':pd.Series([3,3,3,3])})

    
    diffExp = calc_diff_abundance(cats, catList)
    print(diffExp)
