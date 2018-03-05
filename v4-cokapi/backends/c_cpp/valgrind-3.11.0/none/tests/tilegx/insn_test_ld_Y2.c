//file: _insn_test_ld_Y2.c
//op=119
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

unsigned long mem[2] = { 0xdd853a2377c4c1cd, 0x7f7658d7010e1ce1 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r19, -17282\n"
                      "shl16insli r19, r19, 6317\n"
                      "shl16insli r19, r19, -15116\n"
                      "shl16insli r19, r19, -17196\n"
                      "moveli r34, -9435\n"
                      "shl16insli r34, r34, 12124\n"
                      "shl16insli r34, r34, -6695\n"
                      "shl16insli r34, r34, 1712\n"
                      "move r34, %2\n"
                      "{ fnop  ; fnop  ; ld r19, r34  }\n"
                      "move %0, r19\n"
                      "move %1, r34\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
