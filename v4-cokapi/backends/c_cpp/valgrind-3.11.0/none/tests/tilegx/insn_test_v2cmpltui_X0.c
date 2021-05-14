//file: _insn_test_v2cmpltui_X0.c
//op=290
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

unsigned long mem[2] = { 0x4ebafb6d47a2a55b, 0xd6233f383d6fcac4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -25706\n"
                      "shl16insli r38, r38, -25275\n"
                      "shl16insli r38, r38, 17720\n"
                      "shl16insli r38, r38, 16967\n"
                      "moveli r24, -18642\n"
                      "shl16insli r24, r24, -25898\n"
                      "shl16insli r24, r24, -7881\n"
                      "shl16insli r24, r24, 8833\n"
                      "{ v2cmpltui r38, r24, -54 ; fnop   }\n"
                      "move %0, r38\n"
                      "move %1, r24\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
