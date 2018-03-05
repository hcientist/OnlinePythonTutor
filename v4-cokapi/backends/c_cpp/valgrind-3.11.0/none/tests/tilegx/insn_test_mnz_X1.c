//file: _insn_test_mnz_X1.c
//op=153
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

unsigned long mem[2] = { 0xc8c9da0e90770658, 0x3dce75e113642c2b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, 24848\n"
                      "shl16insli r11, r11, -12444\n"
                      "shl16insli r11, r11, -9823\n"
                      "shl16insli r11, r11, -18157\n"
                      "moveli r30, 11291\n"
                      "shl16insli r30, r30, -29222\n"
                      "shl16insli r30, r30, 27249\n"
                      "shl16insli r30, r30, -15038\n"
                      "moveli r22, 31329\n"
                      "shl16insli r22, r22, 2611\n"
                      "shl16insli r22, r22, -21984\n"
                      "shl16insli r22, r22, -27173\n"
                      "{ fnop  ; mnz r11, r30, r22  }\n"
                      "move %0, r11\n"
                      "move %1, r30\n"
                      "move %2, r22\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
