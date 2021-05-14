// Example C++ code for OPT
// From: http://www.inference.phy.cam.ac.uk/teaching/comput/C++/examples/SimpleClass.shtml

// DateClass.cc
// Program to demonstrate the definition of a simple class
// and member functions

#include <iostream>
using namespace std;


// Declaration of Date class
class Date {

public:  
  Date(int, int, int);
  void set(int, int, int);
  void print();

private:
  int year;
  int month;
  int day;
};


int main()
{
   // Declare today to be object of class Date
   // Values are automatically intialised by calling constructor function
   Date today(1,9,1999);

   cout << "This program was written on ";
   today.print(); 

   cout << "This program was modified on ";
   today.set(5,10,1999);
   today.print();

   return 0;
}

// Date constructor function definition
Date::Date(int d, int m, int y)
{
  if(d>0 && d<31) day = d;
  if(m>0 && m<13) month = m;
  if(y>0) year =y;
}

// Date member function definitions
void Date::set(int d, int m, int y)
{
  if(d>0 && d<31) day = d;
  if(m>0 && m<13) month = m;
  if(y>0) year =y;
}

void Date::print()
{
  cout << day << "-" << month << "-" << year << endl;
}
