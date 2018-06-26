import plotly.plotly as py
import plotly.graph_objs as go
import numpy as np
in_y=[]
for x in range(0,10):
    in_y.append(2*x)
trace = go.Bar(
    x = np.array(range(0,10)),
    y = np.array(in_y),
)
data = [trace]
py.plot(data, filename='scattertest', image='jpeg')