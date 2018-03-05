//file: _insn_test_shrui_X0.c
//op=202
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

unsigned long mem[2] = { 0xf903c34a732ec74d, 0x1b58c82cfa9e7805 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r44, 22940\n"
                      "shl16insli r44, r44, -25012\n"
                      "shl16insli r44, r44, 1293\n"
                      "shl16insli r44, r44, 20844\n"
                      "moveli r5, 4497\n"
                      "shl16insli r5, r5, 8011\n"
                      "shl16insli r5, r5, -29488\n"
                      "shl16insli r5, r5, -23563\n"
                      "{ shrui r44, r5, 30 ; fnop   }\n"
                      "move %0, r44\n"
                      "move %1, r5\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
