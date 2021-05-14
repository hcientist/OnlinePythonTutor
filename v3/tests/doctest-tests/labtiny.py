# some examples adapted from https://docs.python.org/2/library/doctest.html

'''

LAB_NAME = "First doctest lab"

LAB_DESCRIPTION =
This is my first **lab** in [markdown](https://daringfireball.net/projects/markdown/syntax) format

- shawn
- is
- cool

woohoo!

'''


# helper function written by student, not part of the lab
def add(x, y):
    return x + y


def slow_multiply(a, b):
    """
    Lab part 2

    Return the product of 'a' and 'b'
   
    ------

>>> print slow_multiply(3, 5)
15

    """


    i = 0
    prod = 0
    for i in range(b):
        prod = add(prod, a)
    return prod
