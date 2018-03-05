// From the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

// functions.c
// TypesTest application exercises various C data types
// Philip Guo 3-9-04

#include <stdlib.h>
#include <stdio.h>

typedef unsigned char          UChar;
typedef unsigned short         UShort;
typedef unsigned int           UInt;
typedef unsigned long long int ULong;

typedef signed char            Char;
typedef signed short           Short;
typedef signed int             Int;
typedef signed long long int   Long;

Char returnCharSum(Char a, Char b);
Short returnShortSum(Short a, Short b);
Int returnIntSum(UChar a, Short b);
Long returnLongSum(Long a, Long b);

UChar returnUCharProduct(UChar a, UChar b);
UShort returnUShortProduct(UShort a, UShort b);
UInt returnUIntProduct(Char a, Short b);
ULong returnULongProduct(Long a, Int b);

double returnDoubleSum(float a, double b);
float returnFloatProduct(float a, float b);


// Note!!!  These functions may overflow or function improperly
// at times.  The purpose is not to demonstrate correctness, but
// rather to present interesting cases for function parameter and
// return value tracking.

Char returnCharSum(const Char a, Char b)
{
  return (a + b);
}

Short returnShortSum(const Short a, Short b)
{
  return (a + b);
}

Int returnIntSum(const UChar a, Short b)
{
  return (a + b);
}

// Initial observations!  Long variables are too BIG to store
// in EAX so it may be stored elsewhere.  Maybe a pointer to
// it is stored in EAX.  This returns the INCORRECT VALUE!
Long returnLongSum(Long a, Long b)
{
  Long tempA = a;
  tempA -= 100;
  tempA += 100;
  return (tempA + b);
}

// It may easily overflow!
UChar returnUCharProduct(UChar a, UChar b)
{
  UChar count;
  UChar total = 0;
  for (count = 0; count < b; count++)
    total = returnCharSum(total, a);
  return total;
}

UShort returnUShortProduct(UShort a, UShort b)
{
  UInt product = (a * b);
  return (UShort)product;
}

UInt returnUIntProduct(Char a, Short b)
{
  Char count;
  UInt total = 0;
  for (count = 0; count < a; count++)
    total = returnIntSum(total, b);
  return total;
}

ULong returnULongProduct(Long a, Int b)
{
  return (a * b);
}

double returnDoubleSum(const float a, double b)
{
  double tempA = a;
  double tempB = b;
  return (tempA + tempB) / 1000000;
}

float returnFloatProduct(float a, float b)
{
  return (a * b) / 1000000;
}

union basicTypesUnion
{
  int int_value;
  char char_value;
  float float_value;
  double double_value;
};

struct bitFieldsStruct
{
  unsigned int a:1;
  unsigned int b:2;
  unsigned int c:3;
  unsigned int d:6;
  long e:10;
  short f:15;
};

void basicFunctionTest();


int main()
{
  //  printf("Types Test by Philip Guo (3-9-04)\n\n");
  basicFunctionTest();
  return 0;
}

// Test basic functions in functions.h
void basicFunctionTest()
{
  int i, j;

  for (i = 0; i < 10; i++) {
    UInt input[18] =
      {18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1};

    // For the sake of calculating comparability, make sure
    // that we pass in unique numbers to all of these functions
    // and not the SAME a or b
    returnCharSum((Char)input[0], (Char)input[1]);
    returnShortSum((Short)input[2], (Short)input[3]);
    returnIntSum((Int)input[4], (Int)input[5]);
    returnLongSum((Long)input[6], (Long)input[7]);
    returnUCharProduct((UChar)input[8], (UChar)input[9]);
    returnUShortProduct((UShort)input[10], (UShort)input[11]);
    returnUIntProduct(input[12], input[13]);
    returnULongProduct((Long)10000000, 10000000);
    returnDoubleSum(((float)input[14])/3, ((double)input[15])*2.718);
    returnFloatProduct(((float)input[16])*3.14159, ((float)input[17])*3.45);
  }
}
