//file: _insn_test_v1mulus_X0.c
//op=266
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

unsigned long mem[2] = { 0x88507c682c9fb1d4, 0xe99ff6bbb270ebf };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r14, -18039\n"
                      "shl16insli r14, r14, 4267\n"
                      "shl16insli r14, r14, 12150\n"
                      "shl16insli r14, r14, 11106\n"
                      "moveli r3, 24521\n"
                      "shl16insli r3, r3, -15738\n"
                      "shl16insli r3, r3, -31870\n"
                      "shl16insli r3, r3, -24660\n"
                      "moveli r15, -31630\n"
                      "shl16insli r15, r15, -11693\n"
                      "shl16insli r15, r15, 19273\n"
                      "shl16insli r15, r15, 31577\n"
                      "{ v1mulus r14, r3, r15 ; fnop   }\n"
                      "move %0, r14\n"
                      "move %1, r3\n"
                      "move %2, r15\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
