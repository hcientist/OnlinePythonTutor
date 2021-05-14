//file: _insn_test_fsingle_mul2_X0.c
//op=105
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

unsigned long mem[2] = { 0x4419397566d0f360, 0xebc915599850d350 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r36, 15980\n"
                      "shl16insli r36, r36, 6185\n"
                      "shl16insli r36, r36, -3610\n"
                      "shl16insli r36, r36, -10263\n"
                      "moveli r48, 11819\n"
                      "shl16insli r48, r48, -3940\n"
                      "shl16insli r48, r48, 25912\n"
                      "shl16insli r48, r48, 22355\n"
                      "moveli r9, -832\n"
                      "shl16insli r9, r9, -16346\n"
                      "shl16insli r9, r9, -24487\n"
                      "shl16insli r9, r9, 31724\n"
                      "{ fsingle_mul2 r36, r48, r9 ; fnop   }\n"
                      "move %0, r36\n"
                      "move %1, r48\n"
                      "move %2, r9\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
