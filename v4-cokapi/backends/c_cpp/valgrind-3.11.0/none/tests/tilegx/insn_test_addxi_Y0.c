//file: _insn_test_addxi_Y0.c
//op=26
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

unsigned long mem[2] = { 0x82cd9e74ccb2b602, 0xb405f09d3ac1f78c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, -28042\n"
                      "shl16insli r16, r16, 29759\n"
                      "shl16insli r16, r16, 8449\n"
                      "shl16insli r16, r16, -25778\n"
                      "moveli r19, 15873\n"
                      "shl16insli r19, r19, -26278\n"
                      "shl16insli r19, r19, -22224\n"
                      "shl16insli r19, r19, 11419\n"
                      "{ addxi r16, r19, -1 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r16\n"
                      "move %1, r19\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
