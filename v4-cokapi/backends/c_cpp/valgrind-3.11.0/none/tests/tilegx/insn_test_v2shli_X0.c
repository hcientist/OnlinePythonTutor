//file: _insn_test_v2shli_X0.c
//op=313
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

unsigned long mem[2] = { 0x499ada215a6ab283, 0x5c0e0858161567af };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -21610\n"
                      "shl16insli r34, r34, -29358\n"
                      "shl16insli r34, r34, -13412\n"
                      "shl16insli r34, r34, 28660\n"
                      "moveli r48, 16361\n"
                      "shl16insli r48, r48, 2055\n"
                      "shl16insli r48, r48, 4220\n"
                      "shl16insli r48, r48, 9151\n"
                      "{ v2shli r34, r48, 2 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r48\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
