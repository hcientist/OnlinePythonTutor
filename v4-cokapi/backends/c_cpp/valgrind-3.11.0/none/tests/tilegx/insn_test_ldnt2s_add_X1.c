//file: _insn_test_ldnt2s_add_X1.c
//op=141
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

unsigned long mem[2] = { 0x818b8dda9648095a, 0xa1c9172b9a0d1dac };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r6, 29106\n"
                      "shl16insli r6, r6, 15753\n"
                      "shl16insli r6, r6, -26093\n"
                      "shl16insli r6, r6, -30730\n"
                      "moveli r14, -23898\n"
                      "shl16insli r14, r14, 12060\n"
                      "shl16insli r14, r14, 9181\n"
                      "shl16insli r14, r14, 3478\n"
                      "move r14, %2\n"
                      "{ fnop  ; ldnt2s_add r6, r14, 107  }\n"
                      "move %0, r6\n"
                      "move %1, r14\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
