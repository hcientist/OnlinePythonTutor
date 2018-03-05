//file: _insn_test_mul_hu_hu_Y0.c
//op=159
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

unsigned long mem[2] = { 0x2f10bc93a323ca0d, 0x9be2dc4ee83ae1ea };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r18, -11405\n"
                      "shl16insli r18, r18, -6947\n"
                      "shl16insli r18, r18, 19133\n"
                      "shl16insli r18, r18, -19900\n"
                      "moveli r27, 31983\n"
                      "shl16insli r27, r27, 16872\n"
                      "shl16insli r27, r27, 25578\n"
                      "shl16insli r27, r27, 12902\n"
                      "moveli r10, 20609\n"
                      "shl16insli r10, r10, -28665\n"
                      "shl16insli r10, r10, -5637\n"
                      "shl16insli r10, r10, -7979\n"
                      "{ mul_hu_hu r18, r27, r10 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r18\n"
                      "move %1, r27\n"
                      "move %2, r10\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
