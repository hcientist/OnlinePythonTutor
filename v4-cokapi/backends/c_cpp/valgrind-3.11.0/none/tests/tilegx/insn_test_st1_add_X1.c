//file: _insn_test_st1_add_X1.c
//op=208
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

unsigned long mem[2] = { 0x94fce0885d473733, 0xe22608b00f39a4c5 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, -21466\n"
                      "shl16insli r47, r47, 11354\n"
                      "shl16insli r47, r47, -10374\n"
                      "shl16insli r47, r47, 87\n"
                      "moveli r29, 29514\n"
                      "shl16insli r29, r29, 14828\n"
                      "shl16insli r29, r29, 1013\n"
                      "shl16insli r29, r29, 14302\n"
                      "move r47, %2\n"
                      "{ fnop  ; st1_add r47, r29, -39  }\n"
                      "move %0, r47\n"
                      "move %1, r29\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
