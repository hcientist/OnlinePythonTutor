//file: _insn_test_st2_add_X1.c
//op=210
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

unsigned long mem[2] = { 0x3e6c1829f1e6d7e9, 0x4419397566d0f360 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, -832\n"
                      "shl16insli r47, r47, -16346\n"
                      "shl16insli r47, r47, -24487\n"
                      "shl16insli r47, r47, 31724\n"
                      "moveli r34, -11697\n"
                      "shl16insli r34, r34, 28366\n"
                      "shl16insli r34, r34, -10445\n"
                      "shl16insli r34, r34, -26110\n"
                      "move r47, %2\n"
                      "{ fnop  ; st2_add r47, r34, 123  }\n"
                      "move %0, r47\n"
                      "move %1, r34\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
