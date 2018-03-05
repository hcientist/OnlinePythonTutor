//file: _insn_test_st_add_X1.c
//op=213
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

unsigned long mem[2] = { 0xb47fef7957f607a6, 0x8f11359b0d4a2989 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, -13060\n"
                      "shl16insli r29, r29, 30193\n"
                      "shl16insli r29, r29, -17572\n"
                      "shl16insli r29, r29, -9789\n"
                      "moveli r42, 27632\n"
                      "shl16insli r42, r42, 12264\n"
                      "shl16insli r42, r42, 18107\n"
                      "shl16insli r42, r42, 1639\n"
                      "move r29, %2\n"
                      "{ fnop  ; st_add r29, r42, 41  }\n"
                      "move %0, r29\n"
                      "move %1, r42\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
