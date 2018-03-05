//file: _insn_test_mul_hs_hs_Y0.c
//op=155
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

unsigned long mem[2] = { 0xc707c0e7f8704eba, 0x1518d5b56d04d8a5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, 2892\n"
                      "shl16insli r39, r39, -15734\n"
                      "shl16insli r39, r39, -18162\n"
                      "shl16insli r39, r39, -30153\n"
                      "moveli r32, 31894\n"
                      "shl16insli r32, r32, -18512\n"
                      "shl16insli r32, r32, 13763\n"
                      "shl16insli r32, r32, -9785\n"
                      "moveli r18, 14299\n"
                      "shl16insli r18, r18, -16601\n"
                      "shl16insli r18, r18, -30080\n"
                      "shl16insli r18, r18, 10179\n"
                      "{ mul_hs_hs r39, r32, r18 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r39\n"
                      "move %1, r32\n"
                      "move %2, r18\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
