//file: _insn_test_ld4s_X1.c
//op=128
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

unsigned long mem[2] = { 0xcef60e4c85b01644, 0x411d3fc3fc916064 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r15, -5570\n"
                      "shl16insli r15, r15, -29385\n"
                      "shl16insli r15, r15, -18769\n"
                      "shl16insli r15, r15, -2309\n"
                      "moveli r48, -28670\n"
                      "shl16insli r48, r48, -6265\n"
                      "shl16insli r48, r48, 15425\n"
                      "shl16insli r48, r48, 17326\n"
                      "move r48, %2\n"
                      "{ fnop  ; ld4s r15, r48  }\n"
                      "move %0, r15\n"
                      "move %1, r48\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
