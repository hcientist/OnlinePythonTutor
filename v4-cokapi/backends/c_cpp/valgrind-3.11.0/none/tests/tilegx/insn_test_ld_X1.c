//file: _insn_test_ld_X1.c
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
                      "moveli r42, -17282\n"
                      "shl16insli r42, r42, 6317\n"
                      "shl16insli r42, r42, -15116\n"
                      "shl16insli r42, r42, -17196\n"
                      "moveli r26, -9435\n"
                      "shl16insli r26, r26, 12124\n"
                      "shl16insli r26, r26, -6695\n"
                      "shl16insli r26, r26, 1712\n"
                      "move r26, %2\n"
                      "{ fnop  ; ld r42, r26  }\n"
                      "move %0, r42\n"
                      "move %1, r26\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
