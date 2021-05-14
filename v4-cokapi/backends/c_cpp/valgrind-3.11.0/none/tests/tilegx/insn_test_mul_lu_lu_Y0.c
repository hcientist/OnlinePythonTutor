//file: _insn_test_mul_lu_lu_Y0.c
//op=164
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

unsigned long mem[2] = { 0xd75570c277b73b03, 0x5ff5d41ce72b342e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r24, 10847\n"
                      "shl16insli r24, r24, -21273\n"
                      "shl16insli r24, r24, -26560\n"
                      "shl16insli r24, r24, -2137\n"
                      "moveli r22, -4257\n"
                      "shl16insli r22, r22, 16637\n"
                      "shl16insli r22, r22, -13862\n"
                      "shl16insli r22, r22, 2993\n"
                      "moveli r2, 2928\n"
                      "shl16insli r2, r2, -22351\n"
                      "shl16insli r2, r2, 15965\n"
                      "shl16insli r2, r2, -15676\n"
                      "{ mul_lu_lu r24, r22, r2 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r24\n"
                      "move %1, r22\n"
                      "move %2, r2\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
