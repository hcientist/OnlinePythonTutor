//file: _insn_test_ld1s_X1.c
//op=120
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

unsigned long mem[2] = { 0xfd529a461f919c3b, 0xa702a184ea8a31f7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -25406\n"
                      "shl16insli r38, r38, 4116\n"
                      "shl16insli r38, r38, 26061\n"
                      "shl16insli r38, r38, -21556\n"
                      "moveli r25, 9517\n"
                      "shl16insli r25, r25, -14743\n"
                      "shl16insli r25, r25, 28886\n"
                      "shl16insli r25, r25, 23646\n"
                      "move r25, %2\n"
                      "{ fnop  ; ld1s r38, r25  }\n"
                      "move %0, r38\n"
                      "move %1, r25\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
