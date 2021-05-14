//file: _insn_test_st4_add_X1.c
//op=212
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

unsigned long mem[2] = { 0x8a665fbee6262b19, 0x988b16de50a53a0a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r9, -5920\n"
                      "shl16insli r9, r9, 6097\n"
                      "shl16insli r9, r9, -2456\n"
                      "shl16insli r9, r9, 10572\n"
                      "moveli r45, 20609\n"
                      "shl16insli r45, r45, -28665\n"
                      "shl16insli r45, r45, -5637\n"
                      "shl16insli r45, r45, -7979\n"
                      "move r9, %2\n"
                      "{ fnop  ; st4_add r9, r45, -34  }\n"
                      "move %0, r9\n"
                      "move %1, r45\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
