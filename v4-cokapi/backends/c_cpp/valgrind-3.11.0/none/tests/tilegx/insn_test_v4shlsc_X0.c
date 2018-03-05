//file: _insn_test_v4shlsc_X0.c
//op=327
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

unsigned long mem[2] = { 0x2568a113544174a0, 0xd019893a69c430df };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, -616\n"
                      "shl16insli r13, r13, -17536\n"
                      "shl16insli r13, r13, -4093\n"
                      "shl16insli r13, r13, -4473\n"
                      "moveli r27, 28804\n"
                      "shl16insli r27, r27, -24345\n"
                      "shl16insli r27, r27, 3201\n"
                      "shl16insli r27, r27, -21187\n"
                      "moveli r33, 2083\n"
                      "shl16insli r33, r33, -15312\n"
                      "shl16insli r33, r33, -6918\n"
                      "shl16insli r33, r33, -23024\n"
                      "{ v4shlsc r13, r27, r33 ; fnop   }\n"
                      "move %0, r13\n"
                      "move %1, r27\n"
                      "move %2, r33\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
