def square(x):
    return x*x
#(*)ashteric used as multiplication in python
def map(f, lst):
    ret = []
    for elt in lst:
        ret.append(f(elt))
    return ret

y = map(square, [1,2,3,4,5,6])

