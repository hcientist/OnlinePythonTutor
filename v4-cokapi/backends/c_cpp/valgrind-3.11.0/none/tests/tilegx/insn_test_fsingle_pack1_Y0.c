//file: _insn_test_fsingle_pack1_Y0.c
//op=106
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

unsigned long mem[2] = { 0x988b16de50a53a0a, 0x5fced320ec74ecd8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, -30106\n"
                      "shl16insli r46, r46, 24510\n"
                      "shl16insli r46, r46, -6618\n"
                      "shl16insli r46, r46, 11033\n"
                      "moveli r26, -11405\n"
                      "shl16insli r26, r26, -6947\n"
                      "shl16insli r26, r26, 19133\n"
                      "shl16insli r26, r26, -19900\n"
                      "{ fsingle_pack1 r46, r26 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r46\n"
                      "move %1, r26\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
