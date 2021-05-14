//file: _insn_test_v2sadas_X0.c
//op=308
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

unsigned long mem[2] = { 0x62e80c5c43ae1476, 0x75d452e3a144efb8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, 241\n"
                      "shl16insli r23, r23, -14815\n"
                      "shl16insli r23, r23, -21901\n"
                      "shl16insli r23, r23, -3061\n"
                      "moveli r7, -22129\n"
                      "shl16insli r7, r7, -14930\n"
                      "shl16insli r7, r7, -14368\n"
                      "shl16insli r7, r7, -8560\n"
                      "moveli r29, -18028\n"
                      "shl16insli r29, r29, -11276\n"
                      "shl16insli r29, r29, 30167\n"
                      "shl16insli r29, r29, -30797\n"
                      "{ v2sadas r23, r7, r29 ; fnop   }\n"
                      "move %0, r23\n"
                      "move %1, r7\n"
                      "move %2, r29\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
