//file: _insn_test_rotli_X1.c
//op=187
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

unsigned long mem[2] = { 0x7703657413b27076, 0x1bee8662fa44392b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, 16585\n"
                      "shl16insli r38, r38, 19462\n"
                      "shl16insli r38, r38, 29122\n"
                      "shl16insli r38, r38, -30058\n"
                      "moveli r7, 3682\n"
                      "shl16insli r7, r7, 7348\n"
                      "shl16insli r7, r7, -12127\n"
                      "shl16insli r7, r7, 24558\n"
                      "{ fnop  ; rotli r38, r7, 53  }\n"
                      "move %0, r38\n"
                      "move %1, r7\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
