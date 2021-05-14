//file: _insn_test_or_Y1.c
//op=181
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

unsigned long mem[2] = { 0xbda18e421a932d37, 0xe49de7021c00d425 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, 4269\n"
                      "shl16insli r13, r13, 12585\n"
                      "shl16insli r13, r13, 23528\n"
                      "shl16insli r13, r13, -28113\n"
                      "moveli r36, 3720\n"
                      "shl16insli r36, r36, 21467\n"
                      "shl16insli r36, r36, 16503\n"
                      "shl16insli r36, r36, -15551\n"
                      "moveli r7, -17228\n"
                      "shl16insli r7, r7, -9907\n"
                      "shl16insli r7, r7, 11604\n"
                      "shl16insli r7, r7, -13348\n"
                      "{ fnop  ; or r13, r36, r7 ; ld r63, r54  }\n"
                      "move %0, r13\n"
                      "move %1, r36\n"
                      "move %2, r7\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
