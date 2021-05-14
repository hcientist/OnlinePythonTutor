'''

# My first Labyrinth lab

This is the lab description -- write whatever you want in here in
*markdown* format and it will show up as the toplevel docstring for this module

- shawn
- is
- cool

1. code code code
2. write paper
3. profit $$$

woohoo!

'''


def factorial(n):
    """
    Lab part 1

    lab description in markdown format
   
    Return the factorial of n, an exact integer >= 0.

    If the result is small enough to fit in an int, return an int.
    Else return a long.

    ------

    >>> print [factorial(n) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> print [factorial(long(n)) for n in range(6)]
    [1, 1, 2, 6, 24, 120]
    >>> print factorial(30)
    265252859812191058636308480000000
    >>> print factorial(30L)
    265252859812191058636308480000000
    >>> print factorial(-1)
    Traceback (most recent call last):
        ...
    ValueError: n must be >= 0
    >>> print factorial(30.1)
    Traceback (most recent call last):
        ...
    ValueError: n must be exact integer
    >>> print factorial(30.0)
    265252859812191058636308480000000
    >>> print factorial(1e100)
    Traceback (most recent call last):
        ...
    OverflowError: n too large
    """
    import math
    if not n >= 0:
        raise ValueError("n must be >= 0")
    if math.floor(n) != n:
        raise ValueError("n must be exact integer")
    if n+1 == n:  # catch a value like 1e300
        raise OverflowError("n too large")
    result = 1
    factor = 2
    while factor <= n:
        result *= factor
        factor += 1
    return result


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
>>> print slow_multiply(5, 3)
15
>>> print slow_multiply(0, 1)
0
>>> print slow_multiply(0, 100)
0
>>> print slow_multiply(-1, 5)
-5

    """

    i = 0
    prod = 0
    for i in range(b):
        prod = add(prod, a)
    return prod


GLOBAL_DATA = [{"name": "John",  "age": 21},
               {"name": "Jane",  "age": 35},
               {"name": "Carol", "age": 18}]

def find_age(person):
    """
    Lab part 3

    Fetch the age for a given person's name
   
    ------

>>> print find_age('John')
21
>>> print find_age('Carol')
18
>>> print find_age('Jane')
35
>>> print find_age('jane')
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "lab1.py", line 114, in find_age
    raise KeyError # not found!
KeyError
>>> print find_age('bobby')
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "lab1.py", line 114, in find_age
    raise KeyError # not found!
KeyError
    """
    for e in GLOBAL_DATA:
        if e["name"] == person:
            return e["age"]
    raise KeyError # not found!
