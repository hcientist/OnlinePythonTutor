//file: _insn_test_ld_add_X1.c
//op=132
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

unsigned long mem[2] = { 0x3076e248a1b03309, 0x386e67ed7b089fc9 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r27, 26677\n"
                      "shl16insli r27, r27, 32003\n"
                      "shl16insli r27, r27, 16745\n"
                      "shl16insli r27, r27, -29543\n"
                      "moveli r39, 27432\n"
                      "shl16insli r39, r39, -22439\n"
                      "shl16insli r39, r39, 15226\n"
                      "shl16insli r39, r39, -19568\n"
                      "move r39, %2\n"
                      "{ fnop  ; ld_add r27, r39, 118  }\n"
                      "move %0, r27\n"
                      "move %1, r39\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
