//file: _insn_test_st1_Y2.c
//op=207
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

unsigned long mem[2] = { 0xd8cf3760900235c5, 0x4e5b0c323c359e88 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, 31115\n"
                      "shl16insli r32, r32, -26645\n"
                      "shl16insli r32, r32, -28059\n"
                      "shl16insli r32, r32, -26401\n"
                      "moveli r51, -23165\n"
                      "shl16insli r51, r51, 1139\n"
                      "shl16insli r51, r51, -11511\n"
                      "shl16insli r51, r51, -24395\n"
                      "move r32, %2\n"
                      "{ fnop  ; fnop  ; st1 r32, r51  }\n"
                      "move %0, r32\n"
                      "move %1, r51\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
