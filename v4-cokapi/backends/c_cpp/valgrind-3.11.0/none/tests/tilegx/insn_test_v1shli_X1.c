//file: _insn_test_v1shli_X1.c
//op=271
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

unsigned long mem[2] = { 0x83de1f8744af2d85, 0x6f2ecad32a189723 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, -23389\n"
                      "shl16insli r16, r16, 14250\n"
                      "shl16insli r16, r16, -12431\n"
                      "shl16insli r16, r16, 3789\n"
                      "moveli r46, 12068\n"
                      "shl16insli r46, r46, 8339\n"
                      "shl16insli r46, r46, 11978\n"
                      "shl16insli r46, r46, 15868\n"
                      "{ fnop  ; v1shli r16, r46, 47  }\n"
                      "move %0, r16\n"
                      "move %1, r46\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
