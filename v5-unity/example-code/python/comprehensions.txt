# list comprehension
l = [e**e for e in range(10) if e%2==0]
# set comprehension
s = {e**e for e in range(10) if e%2==0}
# dict comprehension
d = {e: e**e for e in range(10) if e%2==0}
