//file: _insn_test_shl16insli_X1.c
//op=189
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

unsigned long mem[2] = { 0x842f1ff3b535c0ff, 0xb4e168d3b1d1a300 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, -11895\n"
                      "shl16insli r29, r29, 21718\n"
                      "shl16insli r29, r29, -14088\n"
                      "shl16insli r29, r29, -5322\n"
                      "moveli r27, -18517\n"
                      "shl16insli r27, r27, 12387\n"
                      "shl16insli r27, r27, 27111\n"
                      "shl16insli r27, r27, 15808\n"
                      "{ fnop  ; shl16insli r29, r27, -27202  }\n"
                      "move %0, r29\n"
                      "move %1, r27\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
