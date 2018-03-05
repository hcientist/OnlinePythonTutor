//file: _insn_test_dblalign6_X1.c
//op=77
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

unsigned long mem[2] = { 0x32e0ae3536cebe67, 0x8917ce8584615586 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, 30164\n"
                      "shl16insli r45, r45, 21219\n"
                      "shl16insli r45, r45, -24252\n"
                      "shl16insli r45, r45, -4168\n"
                      "moveli r35, 27921\n"
                      "shl16insli r35, r35, 15394\n"
                      "shl16insli r35, r35, -22195\n"
                      "shl16insli r35, r35, 26084\n"
                      "moveli r2, 25320\n"
                      "shl16insli r2, r2, 3164\n"
                      "shl16insli r2, r2, 17326\n"
                      "shl16insli r2, r2, 5238\n"
                      "{ fnop  ; dblalign6 r45, r35, r2  }\n"
                      "move %0, r45\n"
                      "move %1, r35\n"
                      "move %2, r2\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
