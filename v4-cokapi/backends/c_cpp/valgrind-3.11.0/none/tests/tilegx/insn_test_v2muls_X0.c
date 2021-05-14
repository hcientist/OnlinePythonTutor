//file: _insn_test_v2muls_X0.c
//op=302
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

unsigned long mem[2] = { 0x16cf0b15dab31447, 0x4f71ee192e8cc1e4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, 14213\n"
                      "shl16insli r35, r35, -12906\n"
                      "shl16insli r35, r35, -10898\n"
                      "shl16insli r35, r35, 21664\n"
                      "moveli r33, -3303\n"
                      "shl16insli r33, r33, -18198\n"
                      "shl16insli r33, r33, 17267\n"
                      "shl16insli r33, r33, -25748\n"
                      "moveli r48, -32118\n"
                      "shl16insli r48, r48, -21438\n"
                      "shl16insli r48, r48, -21975\n"
                      "shl16insli r48, r48, -17458\n"
                      "{ v2muls r35, r33, r48 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r33\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
