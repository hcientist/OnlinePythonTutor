// From the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef long long int rhubarbInt64;
typedef unsigned long long int UrhubarbInt64;
typedef unsigned int* UIntPtr;

char* globalStr = "MR FURLEY\t\nis a good man\rhello\tworld\t\n\n\n\\ \r \r a\r  \\b \\c";
//char* globalStr = "ABCDEFGHIJKLMNOPQRSTUVWXYV1234567890";
//unsigned char* localAAddr;
int globalInt = 5555;
double globalDouble = 12345.67890123;
unsigned long long int globalLong = 6969696969696969;
static const int globalWkdayA = 4;

typedef struct _basicTypesStruct
{
  char char_val;
  unsigned char uchar_val;
  short short_val;
  unsigned short ushort_val;
  int int_val;
  //  unsigned int uint_val;
  //  rhubarbInt64 Int64_val;
  //  UrhubarbInt64 UInt64_val;
  //  float float_val;
  //  double double_val;
  //  float float_val2;
  //  double double_val2;
}
basicTypesStruct;

typedef enum weekdays
{
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY
}
weekdays;

typedef struct _complexStruct complexStruct;

struct _complexStruct
{
  weekdays day_of_week;
  //  int*** intArray;
  basicTypesStruct basic1;
  complexStruct* next;
  char*** myString;
  basicTypesStruct* basic2;
  complexStruct* prev;
  int footer;
};
/*
int printHelloWorld(double routebaga, char turnip)
{
  printf("Hello world %f %c: ", routebaga, turnip);
  return 0xBEEF;
}

char* returnFooString(int** doubleIntPtr, unsigned short ushortValue)
{
  int i;
  char returnVal[100];
  for (i = 0; i < (**doubleIntPtr); i++)
    returnVal[i] = ((ushortValue + i) % 26) + 'a';
  returnVal[(**doubleIntPtr)] = '\0';
  return returnVal;
}

double* returnDoublePtr(UIntPtr uintPtrVar, rhubarbInt64* Int64PtrVar)
{
  double* tempDouble = (double*)malloc(sizeof(double));
  *tempDouble = (double)((*uintPtrVar) - (*Int64PtrVar)) / 7;
  return tempDouble;
}

int valueAt(int myArray[], int index)
{
  return myArray[index];
}
*/
weekdays returnWeekday(int day)
{
  if ((day >= 0) && (day < 7))
    return (weekdays)day;
  else
    return (weekdays)0;
}

complexStruct** cpg;
const complexStruct*** initBasicTypesStruct(double a,
                          int b,
                          char c,
                          float d,
                          basicTypesStruct** bp,
                          unsigned long long int e,
                          complexStruct** cp,
                          short f)
{
  unsigned char localA = 69;
  int uninitB;
  char** localPtr = &globalStr;
  int wkdayA = 5;
  basicTypesStruct localB = {0, 0, 0, 0, 0};
  cpg = cp;
  //  printf("&localA=%d, &localPtr=%d, &localB=%d\n", &localA, &localPtr, &localB);
  //  localAAddr = &localA; // DON'T DO THIS - Kvasir gets confused by ptrs. to local vars
  //  printf("bp=%d *bp=%d\n", bp, *bp);
  (*bp)->char_val = -42;
  (*bp)->uchar_val = 42;
  (*bp)->short_val = -28000;
  (*bp)->ushort_val = 28000;
  (*bp)->int_val = 1234567890;

  b = 43210;
  c = 43;
  f = 4321;

  //  printf("&(cp[]->myString)=%d, cp[]->myString=%d\n",
  //         &((*cp)->myString),
  //         (*cp)->myString);

  (*cp)->day_of_week = THURSDAY;
  //  (*cp)->intArray = 69;
  (*cp)->basic1 = (**bp);
  (*cp)->myString = &localPtr;
  (*cp)->basic2 = (*bp);
  (*cp)->footer = -123456;

  //  printf("&localPtr=%d, localPtr=%d, globalStr=%d\n",
  //         &localPtr, localPtr, globalStr);

  //  printf("&(cp[]->myString)=%d, cp[]->myString=%d, cp[]->myString[]=%d, cp[]->myString[][]=%s\n",
  //         &((*cp)->myString),
  //         (*cp)->myString,
  //         *((*cp)->myString),
  //         **((*cp)->myString));


  //  printf("cp[]->basic1.char_val=%d, cp[]->basic2=%d\n",
  //         (*cp)->basic1.char_val,
  //         (*cp)->basic2);
  returnWeekday(wkdayA);
  //  printf("bp=%d *bp=%d\n", bp, *bp);
  //  printf("&globalInt=%d\n", &globalInt);
  return (const complexStruct***)&cpg;
}

/*
basicTypesStruct readBasicTypesStruct(basicTypesStruct a, basicTypesStruct b, int c, char d, complexStruct e)
{
// Attempt to print out stack contents:
  char* bytePtr = (char*)(&a);
  int offset;
  for (offset = 0; offset < 96; offset++)
    {
      printf("EBP + %d: %p\n", (offset + 8), *(bytePtr + offset));
    }
  return b;
}
*/

basicTypesStruct readStruct(basicTypesStruct a)
{

}

/*
complexStruct copyComplexStruct(complexStruct* cp)
{
  complexStruct temp;
  temp = (*cp);
  return temp;
}
*/

int main()
{
  double a = 3.1415926;
  //  int b = 123456789;
  int b;
  char c = 96;
  //  float d = 2.71818;
  float d;
  unsigned long long int e = 1234567890123456789;
  short f = 30000;
  basicTypesStruct basic = {1, 2, 3, 4, 5};
  basicTypesStruct* bPtr = &basic;
  complexStruct complex;
  complexStruct* cPtr = &complex;

  memset(&complex, 0, sizeof(complex));
  //  printf("&a=%d, &b=%d, &c=%d, &d=%d, &e=%d, &f=%d\n", &a, &b, &c, &d, &e, &f);
  //  printf("&&basic=%d, &basic=%d, &&complex=%d, &complex=%d\n", &bPtr, bPtr, &cPtr, cPtr);
  //  printf("localAAddr=%d\n", localAAddr);
  initBasicTypesStruct(a, b, c, d, &bPtr, e, &cPtr, f);
  //  printf("localAAddr=%d, *localAAddr=%d\n", localAAddr, *localAAddr);
  //  complexStruct complex;
  //  basic.char_val = 0xab;
  //  basic.uchar_val = 0xcd;
  //  basic.short_val = 0xfedc;
  //  basic.ushort_val = 0xabcd;
  //  basic.int_val = 0xdeadbeef;
  //  basic.uint_val = 0x87654321;

  //  readBasicTypesStruct(basic, basic, 0xcccccccc, 0xbb, complex);
  //  initBasicTypesStruct(&basic);
  /*
  int r;
  char* foo;
  double* doublePtr;
  int smallInt = 30;
  int* smallIntPtr = &smallInt;
  unsigned int uintCrap = 0xDEAD + 10;
  int intArray[10];
  rhubarbInt64 int64Crap = 0xDEAD;
  basicTypesStruct bp;
  complexStruct complex, complexCopy;

  initBasicTypesStruct(&bp);
  //printf("basicTypesStruct char=%c, uchar=%c, int=%X\n",
  //       bp.char_val,
  //       bp.uchar_val,
  //       bp.int_val);

  complex.day_of_week = WEDNESDAY;
  complexCopy = copyComplexStruct(&complex);
  printf("complex.day_of_week = %d, complexCopy.day_of_week = %d\n",
         complex.day_of_week,
         complexCopy.day_of_week);

  r = printHelloWorld(10.594321, 'c');
  printf("%X\n", r);
  foo = returnFooString(&smallIntPtr, 20);
  printf("returnFooString: %s\n", foo);
  doublePtr = returnDoublePtr(&uintCrap, &int64Crap);
  printf("returnDoublePtr: %f\n", *doublePtr);
  free(doublePtr);

  for (r = 0; r < 10; r++)
    intArray[r] = r;

  for (r = 9; r >= 0; r--)
    {
      int tempVal = valueAt(intArray, r);
      weekdays wkday = returnWeekday(r);
      printf("intArray[%d] = %d, weekday = %d\n", r, tempVal, wkday);
    }
  */

  return 0;
}
