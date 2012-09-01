# inputs:
amountBorrowed = 1000
annualRate = 0.08
currentYear = 2010
yearsToBorrow = 10

# output:
amountOwed = amountBorrowed

for i in range(yearsToBorrow):
  currentYear = currentYear + 1
  amountOwed = amountOwed + (amountOwed * annualRate)
  print "Year:", currentYear, "| Amount owed:", round(amountOwed, 2)

