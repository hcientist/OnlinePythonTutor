//file: _insn_test_sub_Y1.c
//op=222
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

unsigned long mem[2] = { 0x87dd16cba069efad, 0x63c2bab813708efb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r31, -31836\n"
                      "shl16insli r31, r31, -15605\n"
                      "shl16insli r31, r31, -32767\n"
                      "shl16insli r31, r31, -3062\n"
                      "moveli r49, 15126\n"
                      "shl16insli r49, r49, -17631\n"
                      "shl16insli r49, r49, 31423\n"
                      "shl16insli r49, r49, 10557\n"
                      "moveli r28, -7514\n"
                      "shl16insli r28, r28, -32499\n"
                      "shl16insli r28, r28, -9013\n"
                      "shl16insli r28, r28, -11291\n"
                      "{ fnop  ; sub r31, r49, r28 ; ld r63, r54  }\n"
                      "move %0, r31\n"
                      "move %1, r49\n"
                      "move %2, r28\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
