//file: _insn_test_stnt2_add_X1.c
//op=218
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

unsigned long mem[2] = { 0x3cfd98eacbf82c51, 0x1fe3ff849620d963 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, 31983\n"
                      "shl16insli r32, r32, -22770\n"
                      "shl16insli r32, r32, 20146\n"
                      "shl16insli r32, r32, -3298\n"
                      "moveli r49, -616\n"
                      "shl16insli r49, r49, -17536\n"
                      "shl16insli r49, r49, -4093\n"
                      "shl16insli r49, r49, -4473\n"
                      "move r32, %2\n"
                      "{ fnop  ; stnt2_add r32, r49, 102  }\n"
                      "move %0, r32\n"
                      "move %1, r49\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
