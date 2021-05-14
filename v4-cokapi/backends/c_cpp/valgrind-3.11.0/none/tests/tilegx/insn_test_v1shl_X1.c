//file: _insn_test_v1shl_X1.c
//op=270
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

unsigned long mem[2] = { 0xe89dbdd9027e7e2c, 0x8f37eee6381b10aa };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, 31287\n"
                      "shl16insli r47, r47, -16865\n"
                      "shl16insli r47, r47, 32203\n"
                      "shl16insli r47, r47, 26808\n"
                      "moveli r20, -31597\n"
                      "shl16insli r20, r20, -25798\n"
                      "shl16insli r20, r20, 24137\n"
                      "shl16insli r20, r20, -18758\n"
                      "moveli r18, 29925\n"
                      "shl16insli r18, r18, -28562\n"
                      "shl16insli r18, r18, 19610\n"
                      "shl16insli r18, r18, 28019\n"
                      "{ fnop  ; v1shl r47, r20, r18  }\n"
                      "move %0, r47\n"
                      "move %1, r20\n"
                      "move %2, r18\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
