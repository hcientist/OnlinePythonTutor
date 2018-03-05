//file: _insn_test_shl1add_Y1.c
//op=190
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

unsigned long mem[2] = { 0x811d401994a9cbd4, 0xc39a04b8ff503c88 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r36, 30711\n"
                      "shl16insli r36, r36, -23959\n"
                      "shl16insli r36, r36, 22299\n"
                      "shl16insli r36, r36, 25192\n"
                      "moveli r33, 24574\n"
                      "shl16insli r33, r33, -7860\n"
                      "shl16insli r33, r33, 22844\n"
                      "shl16insli r33, r33, -25856\n"
                      "moveli r3, -8773\n"
                      "shl16insli r3, r3, 2664\n"
                      "shl16insli r3, r3, -12396\n"
                      "shl16insli r3, r3, -20538\n"
                      "{ fnop  ; shl1add r36, r33, r3 ; ld r63, r54  }\n"
                      "move %0, r36\n"
                      "move %1, r33\n"
                      "move %2, r3\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
