//file: _insn_test_v2avgs_X0.c
//op=282
#include <stdio.h>
#include <stdlib.h>

void func_exit(void) {
     printf("%s\n", __func__);
     exit(0);
}

void func_call(void) {
     printf("%s\n", __func__);
     exit(0);
}

unsigned long mem[2] = { 0x71b23d899a1387f6, 0x818b8dda9648095a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r6, -17474\n"
                      "shl16insli r6, r6, 5541\n"
                      "shl16insli r6, r6, 25238\n"
                      "shl16insli r6, r6, 6803\n"
                      "moveli r50, -5690\n"
                      "shl16insli r50, r50, 12649\n"
                      "shl16insli r50, r50, 15657\n"
                      "shl16insli r50, r50, -29970\n"
                      "moveli r50, 29145\n"
                      "shl16insli r50, r50, 12637\n"
                      "shl16insli r50, r50, -13093\n"
                      "shl16insli r50, r50, 10273\n"
                      "{ v2avgs r6, r50, r50 ; fnop   }\n"
                      "move %0, r6\n"
                      "move %1, r50\n"
                      "move %2, r50\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
