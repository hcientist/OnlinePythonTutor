//file: _insn_test_ld1u_add_X1.c
//op=123
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

unsigned long mem[2] = { 0x71782df005cc3618, 0x98e72847e6d80b39 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r33, 13116\n"
                      "shl16insli r33, r33, 11172\n"
                      "shl16insli r33, r33, -2564\n"
                      "shl16insli r33, r33, 1912\n"
                      "moveli r32, 28219\n"
                      "shl16insli r32, r32, -17492\n"
                      "shl16insli r32, r32, -19727\n"
                      "shl16insli r32, r32, 7684\n"
                      "move r32, %2\n"
                      "{ fnop  ; ld1u_add r33, r32, -75  }\n"
                      "move %0, r33\n"
                      "move %1, r32\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
