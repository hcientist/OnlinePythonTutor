//file: _insn_test_cmul_X0.c
//op=64
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

unsigned long mem[2] = { 0x411d3fc3fc916064, 0x4eb70a2cb8e0ad00 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, -12554\n"
                      "shl16insli r35, r35, 3660\n"
                      "shl16insli r35, r35, -31312\n"
                      "shl16insli r35, r35, 5700\n"
                      "moveli r21, 31847\n"
                      "shl16insli r21, r21, 16845\n"
                      "shl16insli r21, r21, -32108\n"
                      "shl16insli r21, r21, -3821\n"
                      "moveli r42, -5570\n"
                      "shl16insli r42, r42, -29385\n"
                      "shl16insli r42, r42, -18769\n"
                      "shl16insli r42, r42, -2309\n"
                      "{ cmul r35, r21, r42 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r21\n"
                      "move %2, r42\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
