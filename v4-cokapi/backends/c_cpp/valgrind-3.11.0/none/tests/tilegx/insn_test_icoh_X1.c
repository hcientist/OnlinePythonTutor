//file: _insn_test_icoh_X1.c
//op=109
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

unsigned long mem[2] = { 0x1fe3ff849620d963, 0x911b4b9f0928dd1b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r31, 15613\n"
                      "shl16insli r31, r31, -26390\n"
                      "shl16insli r31, r31, -13320\n"
                      "shl16insli r31, r31, 11345\n"
                      "{ fnop  ; icoh r31  }\n"
                      "move %0, r31\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
