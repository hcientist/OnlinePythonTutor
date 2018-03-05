//file: _insn_test_mulax_Y0.c
//op=175
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

unsigned long mem[2] = { 0xf2b0303a92767195, 0x8dd298793721b4a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -15789\n"
                      "shl16insli r48, r48, 590\n"
                      "shl16insli r48, r48, -26270\n"
                      "shl16insli r48, r48, -21766\n"
                      "moveli r44, 23264\n"
                      "shl16insli r44, r44, -28907\n"
                      "shl16insli r44, r44, -1813\n"
                      "shl16insli r44, r44, -17554\n"
                      "moveli r46, -2982\n"
                      "shl16insli r46, r46, -29749\n"
                      "shl16insli r46, r46, 881\n"
                      "shl16insli r46, r46, 9838\n"
                      "{ mulax r48, r44, r46 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r48\n"
                      "move %1, r44\n"
                      "move %2, r46\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
