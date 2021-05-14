//file: _insn_test_ori_X1.c
//op=182
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

unsigned long mem[2] = { 0xfefebc9ad18eac85, 0x6bf7e8d962dcb3ff };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r40, 29084\n"
                      "shl16insli r40, r40, 17620\n"
                      "shl16insli r40, r40, -5765\n"
                      "shl16insli r40, r40, 17748\n"
                      "moveli r36, -12155\n"
                      "shl16insli r36, r36, -29090\n"
                      "shl16insli r36, r36, 11972\n"
                      "shl16insli r36, r36, -26553\n"
                      "{ fnop  ; ori r40, r36, 29  }\n"
                      "move %0, r40\n"
                      "move %1, r36\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
