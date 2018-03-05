//file: _insn_test_ld1u_Y2.c
//op=122
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

unsigned long mem[2] = { 0xae053c723a6c8e37, 0x26836d784e440ab7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, 8260\n"
                      "shl16insli r35, r35, -7206\n"
                      "shl16insli r35, r35, -24567\n"
                      "shl16insli r35, r35, -8840\n"
                      "moveli r9, -18757\n"
                      "shl16insli r9, r9, 26178\n"
                      "shl16insli r9, r9, 32618\n"
                      "shl16insli r9, r9, 22067\n"
                      "move r9, %2\n"
                      "{ fnop  ; fnop  ; ld1u r35, r9  }\n"
                      "move %0, r35\n"
                      "move %1, r9\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
