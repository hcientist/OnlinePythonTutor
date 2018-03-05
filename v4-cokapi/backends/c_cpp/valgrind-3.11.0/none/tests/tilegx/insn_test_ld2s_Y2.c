//file: _insn_test_ld2s_Y2.c
//op=124
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

unsigned long mem[2] = { 0x6d228375c43e27fe, 0x6a0cb98ab56a8e60 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r43, -2019\n"
                      "shl16insli r43, r43, 30837\n"
                      "shl16insli r43, r43, -1194\n"
                      "shl16insli r43, r43, -12623\n"
                      "moveli r41, -17868\n"
                      "shl16insli r41, r41, -15637\n"
                      "shl16insli r41, r41, -21854\n"
                      "shl16insli r41, r41, 31769\n"
                      "move r41, %2\n"
                      "{ fnop  ; fnop  ; ld2s r43, r41  }\n"
                      "move %0, r43\n"
                      "move %1, r41\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
