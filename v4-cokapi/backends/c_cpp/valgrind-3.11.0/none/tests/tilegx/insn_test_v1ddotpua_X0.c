//file: _insn_test_v1ddotpua_X0.c
//op=248
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

unsigned long mem[2] = { 0xf81d7875fb56ceb1, 0x6d228375c43e27fe };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r26, 5758\n"
                      "shl16insli r26, r26, -26380\n"
                      "shl16insli r26, r26, 10010\n"
                      "shl16insli r26, r26, 27850\n"
                      "moveli r35, -28917\n"
                      "shl16insli r35, r35, -6384\n"
                      "shl16insli r35, r35, -11771\n"
                      "shl16insli r35, r35, -16008\n"
                      "moveli r48, -8573\n"
                      "shl16insli r48, r48, 9318\n"
                      "shl16insli r48, r48, -9607\n"
                      "shl16insli r48, r48, 22154\n"
                      "{ v1ddotpua r26, r35, r48 ; fnop   }\n"
                      "move %0, r26\n"
                      "move %1, r35\n"
                      "move %2, r48\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
