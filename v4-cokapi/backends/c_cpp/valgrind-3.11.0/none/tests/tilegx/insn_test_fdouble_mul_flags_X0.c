//file: _insn_test_fdouble_mul_flags_X0.c
//op=84
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

unsigned long mem[2] = { 0xdff35e384e663195, 0xce5c4dd59315697c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, -2482\n"
                      "shl16insli r23, r23, 1883\n"
                      "shl16insli r23, r23, 757\n"
                      "shl16insli r23, r23, 5578\n"
                      "moveli r32, -12252\n"
                      "shl16insli r32, r32, 5860\n"
                      "shl16insli r32, r32, 15129\n"
                      "shl16insli r32, r32, -15375\n"
                      "moveli r3, -4690\n"
                      "shl16insli r3, r3, 18437\n"
                      "shl16insli r3, r3, 14549\n"
                      "shl16insli r3, r3, -22291\n"
                      "{ fdouble_mul_flags r23, r32, r3 ; fnop   }\n"
                      "move %0, r23\n"
                      "move %1, r32\n"
                      "move %2, r3\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
