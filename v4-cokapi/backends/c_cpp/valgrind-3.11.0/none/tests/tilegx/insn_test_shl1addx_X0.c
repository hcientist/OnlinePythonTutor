//file: _insn_test_shl1addx_X0.c
//op=191
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

unsigned long mem[2] = { 0xf057c60d59f89641, 0xa3975d48e8f324d7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, -17307\n"
                      "shl16insli r46, r46, 5811\n"
                      "shl16insli r46, r46, -14070\n"
                      "shl16insli r46, r46, 1938\n"
                      "moveli r24, 31602\n"
                      "shl16insli r24, r24, 20410\n"
                      "shl16insli r24, r24, 32651\n"
                      "shl16insli r24, r24, -17296\n"
                      "moveli r33, 1206\n"
                      "shl16insli r33, r33, 4007\n"
                      "shl16insli r33, r33, -27712\n"
                      "shl16insli r33, r33, 3824\n"
                      "{ shl1addx r46, r24, r33 ; fnop   }\n"
                      "move %0, r46\n"
                      "move %1, r24\n"
                      "move %2, r33\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
