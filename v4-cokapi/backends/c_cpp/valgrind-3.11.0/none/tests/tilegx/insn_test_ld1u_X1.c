//file: _insn_test_ld1u_X1.c
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
                      "moveli r19, 8260\n"
                      "shl16insli r19, r19, -7206\n"
                      "shl16insli r19, r19, -24567\n"
                      "shl16insli r19, r19, -8840\n"
                      "moveli r23, -18757\n"
                      "shl16insli r23, r23, 26178\n"
                      "shl16insli r23, r23, 32618\n"
                      "shl16insli r23, r23, 22067\n"
                      "move r23, %2\n"
                      "{ fnop  ; ld1u r19, r23  }\n"
                      "move %0, r19\n"
                      "move %1, r23\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
