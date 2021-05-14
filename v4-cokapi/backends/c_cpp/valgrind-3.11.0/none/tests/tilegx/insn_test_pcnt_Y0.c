//file: _insn_test_pcnt_Y0.c
//op=183
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

unsigned long mem[2] = { 0x17cffec1aae5ac94, 0xc7c07a1c34655bf8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r21, -18757\n"
                      "shl16insli r21, r21, 26178\n"
                      "shl16insli r21, r21, 32618\n"
                      "shl16insli r21, r21, 22067\n"
                      "moveli r31, -1083\n"
                      "shl16insli r31, r31, 30832\n"
                      "shl16insli r31, r31, 25967\n"
                      "shl16insli r31, r31, 4463\n"
                      "{ pcnt r21, r31 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r21\n"
                      "move %1, r31\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
