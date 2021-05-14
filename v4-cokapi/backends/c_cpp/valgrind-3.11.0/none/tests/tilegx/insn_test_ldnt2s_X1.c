//file: _insn_test_ldnt2s_X1.c
//op=140
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

unsigned long mem[2] = { 0x455f86368ee6a1bf, 0x3f45dbe8d3bddf1e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, 26063\n"
                      "shl16insli r32, r32, 27563\n"
                      "shl16insli r32, r32, 24059\n"
                      "shl16insli r32, r32, -1753\n"
                      "moveli r8, -832\n"
                      "shl16insli r8, r8, -16346\n"
                      "shl16insli r8, r8, -24487\n"
                      "shl16insli r8, r8, 31724\n"
                      "move r8, %2\n"
                      "{ fnop  ; ldnt2s r32, r8  }\n"
                      "move %0, r32\n"
                      "move %1, r8\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
