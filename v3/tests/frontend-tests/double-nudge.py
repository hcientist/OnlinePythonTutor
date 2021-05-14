x = [1, [2,  None]]
y = [1, 2]
z = [1, 2]

x[1][0] = y # should nudge y to over the right
z[1] = x    # should nudge BOTH x and y over to the right
