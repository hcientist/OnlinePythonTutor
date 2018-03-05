//file: _insn_test_xori_X1.c
//op=334
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

unsigned long mem[2] = { 0x2f6c6cfee316d7, 0x334d1321b4c11950 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, 31370\n"
                      "shl16insli r46, r46, -7442\n"
                      "shl16insli r46, r46, 26409\n"
                      "shl16insli r46, r46, 25903\n"
                      "moveli r40, 2219\n"
                      "shl16insli r40, r40, -14686\n"
                      "shl16insli r40, r40, 5250\n"
                      "shl16insli r40, r40, 16891\n"
                      "{ fnop  ; xori r46, r40, 75  }\n"
                      "move %0, r46\n"
                      "move %1, r40\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
