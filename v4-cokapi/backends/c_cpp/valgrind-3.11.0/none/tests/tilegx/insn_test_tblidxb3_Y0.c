//file: _insn_test_tblidxb3_Y0.c
//op=232
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

unsigned long mem[2] = { 0xfd7000ecef4ffb36, 0xcf14c16c8fe6d80a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, 21338\n"
                      "shl16insli r29, r29, -8055\n"
                      "shl16insli r29, r29, -7131\n"
                      "shl16insli r29, r29, 21377\n"
                      "moveli r28, 11583\n"
                      "shl16insli r28, r28, -32720\n"
                      "shl16insli r28, r28, 17409\n"
                      "shl16insli r28, r28, -25838\n"
                      "{ tblidxb3 r29, r28 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r29\n"
                      "move %1, r28\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
