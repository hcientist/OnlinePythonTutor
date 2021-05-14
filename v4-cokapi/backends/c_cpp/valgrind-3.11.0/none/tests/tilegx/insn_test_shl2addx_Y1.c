//file: _insn_test_shl2addx_Y1.c
//op=193
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

unsigned long mem[2] = { 0x853e551b961eaa4c, 0x7867e09f71095915 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r50, -28023\n"
                      "shl16insli r50, r50, -28331\n"
                      "shl16insli r50, r50, 32085\n"
                      "shl16insli r50, r50, -17473\n"
                      "moveli r49, -5833\n"
                      "shl16insli r49, r49, -31753\n"
                      "shl16insli r49, r49, -27071\n"
                      "shl16insli r49, r49, -23683\n"
                      "moveli r21, 6443\n"
                      "shl16insli r21, r21, 17296\n"
                      "shl16insli r21, r21, 8461\n"
                      "shl16insli r21, r21, -6245\n"
                      "{ fnop  ; shl2addx r50, r49, r21 ; ld r63, r54  }\n"
                      "move %0, r50\n"
                      "move %1, r49\n"
                      "move %2, r21\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
