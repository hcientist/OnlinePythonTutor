//file: _insn_test_cmpeqi_Y1.c
//op=54
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

unsigned long mem[2] = { 0xc051e6bca12058e0, 0xd5875ac284be5010 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r49, -29338\n"
                      "shl16insli r49, r49, 4578\n"
                      "shl16insli r49, r49, -8168\n"
                      "shl16insli r49, r49, -29363\n"
                      "moveli r17, 8846\n"
                      "shl16insli r17, r17, -29053\n"
                      "shl16insli r17, r17, -18602\n"
                      "shl16insli r17, r17, 7817\n"
                      "{ fnop  ; cmpeqi r49, r17, -1 ; ld r63, r54  }\n"
                      "move %0, r49\n"
                      "move %1, r17\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
