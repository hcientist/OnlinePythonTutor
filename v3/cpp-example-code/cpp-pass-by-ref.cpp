// Example C++ code for OPT
// From: http://www.inference.phy.cam.ac.uk/teaching/comput/C++/examples/SortReference2.shtml

// SortReference2.cc
// Program to sort two numbers using call by reference. 
// Smallest number is output first.

#include <iostream>
using namespace std;

// Function prototype for call by reference using pointers
// see http://www-h.eng.cam.ac.uk/help/tpl/languages/C++/argsC++.html
// for further advice.
void swap(float &x, float &y);
void swap2(float *px, float *py);
void swap2b(float *px, float *py);

int main()
{
   float a, b;

   a = 2.71;
   b = 3.14;
   
   swap(a, b);
   swap2(&a, &b);
   swap2b(&a, &b);

   return 0;
}

// A function definition for call by reference
// The variables x and y will have their values changed.

void swap(float &x, float &y)
// Swaps x and y data of calling function
{
   float temp;

   temp = x;
   x = y;
   y = temp;
}

void swap2(float *px, float *py) // Here the arguments are pointers
// Swaps x and y data of calling function
{
   float temp;

   temp = *px;  // to find the value associated with the pointer px, use *px
   *px = *py;
   *py = temp;
}

void swap2b(float *px, float *py)
// Swaps x and y data of calling function
{
   float temp;

   temp = px[0];  // A synonym for *px is px[0]
   px[0] = py[0];
   py[0] = temp;
}
