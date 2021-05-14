//file: _insn_test_cmpltui_X0.c
//op=62
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

unsigned long mem[2] = { 0x6a0cb98ab56a8e60, 0xa3f9a29247d48ea1 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r30, 27938\n"
                      "shl16insli r30, r30, -31883\n"
                      "shl16insli r30, r30, -15298\n"
                      "shl16insli r30, r30, 10238\n"
                      "moveli r29, -25838\n"
                      "shl16insli r29, r29, 23398\n"
                      "shl16insli r29, r29, 16827\n"
                      "shl16insli r29, r29, -24775\n"
                      "{ cmpltui r30, r29, 114 ; fnop   }\n"
                      "move %0, r30\n"
                      "move %1, r29\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
