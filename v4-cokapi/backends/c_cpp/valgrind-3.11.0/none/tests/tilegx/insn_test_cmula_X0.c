//file: _insn_test_cmula_X0.c
//op=65
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

unsigned long mem[2] = { 0x553c16d3559d1cee, 0xe53c5e867b2c2d0e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, -20478\n"
                      "shl16insli r35, r35, -22564\n"
                      "shl16insli r35, r35, 7251\n"
                      "shl16insli r35, r35, -29417\n"
                      "moveli r35, 23890\n"
                      "shl16insli r35, r35, 28671\n"
                      "shl16insli r35, r35, -167\n"
                      "shl16insli r35, r35, 16603\n"
                      "moveli r5, 20445\n"
                      "shl16insli r5, r5, -17976\n"
                      "shl16insli r5, r5, -29438\n"
                      "shl16insli r5, r5, -12912\n"
                      "{ cmula r35, r35, r5 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r35\n"
                      "move %2, r5\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
