//file: _insn_test_v1subuc_X0.c
//op=277
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

unsigned long mem[2] = { 0xaec371f1597db508, 0x70a50c305e0116b3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r1, -32522\n"
                      "shl16insli r1, r1, -12465\n"
                      "shl16insli r1, r1, 13861\n"
                      "shl16insli r1, r1, 7011\n"
                      "moveli r13, 25648\n"
                      "shl16insli r13, r13, 19640\n"
                      "shl16insli r13, r13, -32625\n"
                      "shl16insli r13, r13, -6642\n"
                      "moveli r6, 4519\n"
                      "shl16insli r6, r6, 25115\n"
                      "shl16insli r6, r6, 25290\n"
                      "shl16insli r6, r6, -28916\n"
                      "{ v1subuc r1, r13, r6 ; fnop   }\n"
                      "move %0, r1\n"
                      "move %1, r13\n"
                      "move %2, r6\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
