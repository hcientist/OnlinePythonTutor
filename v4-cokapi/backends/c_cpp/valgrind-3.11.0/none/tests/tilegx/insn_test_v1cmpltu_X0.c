//file: _insn_test_v1cmpltu_X0.c
//op=244
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

unsigned long mem[2] = { 0x2044e3daa009dd78, 0xae053c723a6c8e37 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r40, 25454\n"
                      "shl16insli r40, r40, 27378\n"
                      "shl16insli r40, r40, 27144\n"
                      "shl16insli r40, r40, -1050\n"
                      "moveli r29, -3584\n"
                      "shl16insli r29, r29, -12139\n"
                      "shl16insli r29, r29, 27236\n"
                      "shl16insli r29, r29, -11299\n"
                      "moveli r36, -23497\n"
                      "shl16insli r36, r36, 11245\n"
                      "shl16insli r36, r36, 19779\n"
                      "shl16insli r36, r36, 27653\n"
                      "{ v1cmpltu r40, r29, r36 ; fnop   }\n"
                      "move %0, r40\n"
                      "move %1, r29\n"
                      "move %2, r36\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
