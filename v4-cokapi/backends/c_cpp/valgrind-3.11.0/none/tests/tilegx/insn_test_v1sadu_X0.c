//file: _insn_test_v1sadu_X0.c
//op=269
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

unsigned long mem[2] = { 0xdb49fd06b08ce7b9, 0xa5181ef50e01b108 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r23, 21116\n"
                      "shl16insli r23, r23, 9443\n"
                      "shl16insli r23, r23, -5433\n"
                      "shl16insli r23, r23, -6455\n"
                      "moveli r15, 21546\n"
                      "shl16insli r15, r15, -20814\n"
                      "shl16insli r15, r15, -29149\n"
                      "shl16insli r15, r15, 28694\n"
                      "moveli r5, 9956\n"
                      "shl16insli r5, r5, -29770\n"
                      "shl16insli r5, r5, 32138\n"
                      "shl16insli r5, r5, 24785\n"
                      "{ v1sadu r23, r15, r5 ; fnop   }\n"
                      "move %0, r23\n"
                      "move %1, r15\n"
                      "move %2, r5\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
