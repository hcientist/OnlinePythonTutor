//file: _insn_test_v1cmpeqi_X1.c
//op=239
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

unsigned long mem[2] = { 0x645d1ce0b9aa791f, 0xdd076487e2dc381a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r33, 6146\n"
                      "shl16insli r33, r33, -18709\n"
                      "shl16insli r33, r33, -4572\n"
                      "shl16insli r33, r33, -2632\n"
                      "moveli r27, 18247\n"
                      "shl16insli r27, r27, 6533\n"
                      "shl16insli r27, r27, 16990\n"
                      "shl16insli r27, r27, 10640\n"
                      "{ fnop  ; v1cmpeqi r33, r27, 110  }\n"
                      "move %0, r33\n"
                      "move %1, r27\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
