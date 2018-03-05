//file: _insn_test_cmpeq_Y1.c
//op=53
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

unsigned long mem[2] = { 0x5fced320ec74ecd8, 0x28e0d2889b96db6d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r0, -26485\n"
                      "shl16insli r0, r0, 5854\n"
                      "shl16insli r0, r0, 20645\n"
                      "shl16insli r0, r0, 14858\n"
                      "moveli r9, 12048\n"
                      "shl16insli r9, r9, -17261\n"
                      "shl16insli r9, r9, -23773\n"
                      "shl16insli r9, r9, -13811\n"
                      "moveli r7, -30106\n"
                      "shl16insli r7, r7, 24510\n"
                      "shl16insli r7, r7, -6618\n"
                      "shl16insli r7, r7, 11033\n"
                      "{ fnop  ; cmpeq r0, r9, r7 ; ld r63, r54  }\n"
                      "move %0, r0\n"
                      "move %1, r9\n"
                      "move %2, r7\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
