//file: _insn_test_v1shrs_X1.c
//op=272
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

unsigned long mem[2] = { 0x63cf7032972114e1, 0x25733d8b5dc477b4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, -18049\n"
                      "shl16insli r22, r22, 22607\n"
                      "shl16insli r22, r22, -26435\n"
                      "shl16insli r22, r22, 16640\n"
                      "moveli r0, -23960\n"
                      "shl16insli r0, r0, 21412\n"
                      "shl16insli r0, r0, 5756\n"
                      "shl16insli r0, r0, -23361\n"
                      "moveli r30, -27381\n"
                      "shl16insli r30, r30, -5985\n"
                      "shl16insli r30, r30, 29874\n"
                      "shl16insli r30, r30, 15106\n"
                      "{ fnop  ; v1shrs r22, r0, r30  }\n"
                      "move %0, r22\n"
                      "move %1, r0\n"
                      "move %2, r30\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
