//file: _insn_test_fdouble_unpack_max_X0.c
//op=88
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

unsigned long mem[2] = { 0xab961c7cdfcb76d0, 0xa9ccfec4f599744d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, -7064\n"
                      "shl16insli r45, r45, -20382\n"
                      "shl16insli r45, r45, -30133\n"
                      "shl16insli r45, r45, 11394\n"
                      "moveli r5, 26677\n"
                      "shl16insli r5, r5, 32003\n"
                      "shl16insli r5, r5, 16745\n"
                      "shl16insli r5, r5, -29543\n"
                      "moveli r48, -17450\n"
                      "shl16insli r48, r48, 24652\n"
                      "shl16insli r48, r48, 22143\n"
                      "shl16insli r48, r48, -2590\n"
                      "{ fdouble_unpack_max r45, r5, r48 ; fnop   }\n"
                      "move %0, r45\n"
                      "move %1, r5\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
