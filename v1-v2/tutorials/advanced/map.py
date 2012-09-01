def square(x):
    return x*x

def map(f, lst):
    ret = []
    for elt in lst:
        ret.append(f(elt))
    return ret

y = map(square, [1,2,3,4,5,6])

