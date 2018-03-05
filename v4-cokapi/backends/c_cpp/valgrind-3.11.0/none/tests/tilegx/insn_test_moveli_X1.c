//file: _insn_test_moveli_X1.c
//op=7
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

unsigned long mem[2] = { 0x4448037363c51f9a, 0xd2e5cb4994058d63 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, -7137\n"
                      "shl16insli r45, r45, 897\n"
                      "shl16insli r45, r45, 23961\n"
                      "shl16insli r45, r45, -21354\n"
                      "{ fnop  ; moveli r45, -15765  }\n"
                      "move %0, r45\n"
                      :"=r"(a[0]));
    printf("%016lx\n", a[0]);
    return 0;
}
