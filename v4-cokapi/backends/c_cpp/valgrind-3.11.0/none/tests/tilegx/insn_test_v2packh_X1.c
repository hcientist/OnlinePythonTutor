//file: _insn_test_v2packh_X1.c
//op=305
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

unsigned long mem[2] = { 0xbe377398fe6841d2, 0xdc57bd79a15b537d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r31, 4830\n"
                      "shl16insli r31, r31, 30571\n"
                      "shl16insli r31, r31, -14162\n"
                      "shl16insli r31, r31, 16427\n"
                      "moveli r48, 26721\n"
                      "shl16insli r48, r48, 13661\n"
                      "shl16insli r48, r48, 14804\n"
                      "shl16insli r48, r48, 23341\n"
                      "moveli r24, -18421\n"
                      "shl16insli r24, r24, -1115\n"
                      "shl16insli r24, r24, 24581\n"
                      "shl16insli r24, r24, 17697\n"
                      "{ fnop  ; v2packh r31, r48, r24  }\n"
                      "move %0, r31\n"
                      "move %1, r48\n"
                      "move %2, r24\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
