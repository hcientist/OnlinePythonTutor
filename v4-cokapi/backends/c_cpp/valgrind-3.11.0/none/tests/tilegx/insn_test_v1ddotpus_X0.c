//file: _insn_test_v1ddotpus_X0.c
//op=249
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

unsigned long mem[2] = { 0x9870e08023534828, 0x669e8333dc6e20a4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, 27899\n"
                      "shl16insli r35, r35, -1363\n"
                      "shl16insli r35, r35, 695\n"
                      "shl16insli r35, r35, -3150\n"
                      "moveli r47, -31722\n"
                      "shl16insli r47, r47, 28986\n"
                      "shl16insli r47, r47, -27906\n"
                      "shl16insli r47, r47, -13798\n"
                      "moveli r39, 32546\n"
                      "shl16insli r39, r39, -25949\n"
                      "shl16insli r39, r39, -2759\n"
                      "shl16insli r39, r39, -21019\n"
                      "{ v1ddotpus r35, r47, r39 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r47\n"
                      "move %2, r39\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
