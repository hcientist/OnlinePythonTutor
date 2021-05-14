// This artificial program runs a lot of code.  The exact amount depends on
// the command line -- if an arg "0" is given, it does exactly
// the same amount of work, but using four times as much code.
// If an arg >= 1 is given, the amount of code is multiplied by this arg.
//
// It's a stress test for Valgrind's translation speed;  natively the two
// modes run in about the same time (the I-cache effects aren't big enough
// to make a difference), but under Valgrind the one running more code is
// significantly slower due to the extra translation time.

// 31 Aug 2015: this only "works" on x86/amd64/s390 by accident; the
// test is essentially kludged.  This "generates" code into memory
// (the mmap'd area) and the executes it.  But historically and even
// after this commit (r15601), the test has been run without 
// --smc-check=all or all-non-file.  That just happens to work because
// the "generated" code is never modified, so there's never a
// translated-vs-reality coherence problem.  Really we ought to run
// with the new-as-of-r15601 default --smc-check=all-non-file, but that
// hugely slows it down and makes the results non-comparable with
// pre r15601 results, so instead the .vgperf files now specify the
// old default value --smc-check=stack explicitly.


#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <assert.h>
#if defined(__mips__)
#include <asm/cachectl.h>
#include <sys/syscall.h>
#elif defined(__tilegx__)
#include <asm/cachectl.h>
#endif
#include "tests/sys_mman.h"

#define FN_SIZE   1280     // Must be big enough to hold the compiled f()
                           // and any literal pool that might be used
#define N_LOOPS   20000    // Should be divisible by four
#define RATIO     4        // Ratio of code sizes between the two modes

int f(int x, int y)
{
   int i;
   for (i = 0; i < 5000; i++) {
      switch (x % 8) {
       case 1:  y += 3;
       case 2:  y += x;
       case 3:  y *= 2;
       default: y--;
      }
   }
   return y;
}

int main(int argc, char* argv[])
{
   int h, i, sum1 = 0, sum2 = 0, sum3 = 0, sum4 = 0;
   int n_fns, n_reps;

   if (argc <= 1) {
      // Mode 1: not so much code
      n_fns  = N_LOOPS / RATIO;
      n_reps = RATIO;
      printf("mode 1: ");
   } else {
      // Mode 2: lots of code
      const int mul = atoi(argv[1]);
      if (mul == 0)
         n_fns = N_LOOPS;
      else
         n_fns = N_LOOPS * mul;
      n_reps = 1;
      printf("mode 1: ");
   }
   printf("%d copies of f(), %d reps\n", n_fns, n_reps);
   
   char* a = mmap(0, FN_SIZE * n_fns, 
                     PROT_EXEC|PROT_WRITE, 
                     MAP_PRIVATE|MAP_ANONYMOUS, -1,0);
   assert(a != (char*)MAP_FAILED);

   // Make a whole lot of copies of f().  FN_SIZE is much bigger than f()
   // will ever be (we hope).
   for (i = 0; i < n_fns; i++) {
      memcpy(&a[FN_SIZE*i], f, FN_SIZE);
   }

#if defined(__mips__)
   syscall(__NR_cacheflush, a, FN_SIZE * n_fns, ICACHE);
#elif defined(__tilegx__)
   cacheflush(a, FN_SIZE * n_fns, ICACHE);
#endif

   for (h = 0; h < n_reps; h += 1) {
      for (i = 0; i < n_fns; i += 4) {
         int(*f1)(int,int) = (void*)&a[FN_SIZE*(i+0)];
         int(*f2)(int,int) = (void*)&a[FN_SIZE*(i+1)];
         int(*f3)(int,int) = (void*)&a[FN_SIZE*(i+2)];
         int(*f4)(int,int) = (void*)&a[FN_SIZE*(i+3)];
         sum1 += f1(i+0, n_fns-i+0);
         sum2 += f2(i+1, n_fns-i+1);
         sum3 += f3(i+2, n_fns-i+2);
         sum4 += f4(i+3, n_fns-i+3);
         if (i % 1000 == 0)
            printf(".");
      }
   }
   printf("result = %d\n", sum1 + sum2 + sum3 + sum4);
   return 0;
}
