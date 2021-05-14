//file: _insn_test_v1dotpusa_X0.c
//op=256
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

unsigned long mem[2] = { 0xea3e8d37b6aff6fb, 0xcef60e4c85b01644 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, 26537\n"
                      "shl16insli r11, r11, -7716\n"
                      "shl16insli r11, r11, 24513\n"
                      "shl16insli r11, r11, 8687\n"
                      "moveli r35, -7218\n"
                      "shl16insli r35, r35, 7896\n"
                      "shl16insli r35, r35, -22888\n"
                      "shl16insli r35, r35, -25968\n"
                      "moveli r39, -6406\n"
                      "shl16insli r39, r39, -8101\n"
                      "shl16insli r39, r39, 21933\n"
                      "shl16insli r39, r39, 5916\n"
                      "{ v1dotpusa r11, r35, r39 ; fnop   }\n"
                      "move %0, r11\n"
                      "move %1, r35\n"
                      "move %2, r39\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
