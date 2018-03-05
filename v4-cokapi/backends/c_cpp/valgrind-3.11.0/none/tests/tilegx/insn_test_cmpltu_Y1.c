//file: _insn_test_cmpltu_Y1.c
//op=61
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

unsigned long mem[2] = { 0x26836d784e440ab7, 0xef3b92483b066295 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, -20987\n"
                      "shl16insli r13, r13, 15474\n"
                      "shl16insli r13, r13, 14956\n"
                      "shl16insli r13, r13, -29129\n"
                      "moveli r6, 6095\n"
                      "shl16insli r6, r6, -319\n"
                      "shl16insli r6, r6, -21787\n"
                      "shl16insli r6, r6, -21356\n"
                      "moveli r35, 8260\n"
                      "shl16insli r35, r35, -7206\n"
                      "shl16insli r35, r35, -24567\n"
                      "shl16insli r35, r35, -8840\n"
                      "{ fnop  ; cmpltu r13, r6, r35 ; ld r63, r54  }\n"
                      "move %0, r13\n"
                      "move %1, r6\n"
                      "move %2, r35\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
