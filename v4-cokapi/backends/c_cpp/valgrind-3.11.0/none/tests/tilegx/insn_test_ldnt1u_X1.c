//file: _insn_test_ldnt1u_X1.c
//op=138
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

unsigned long mem[2] = { 0x778f2f6f17d9003b, 0x4070076dbab015ca };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r1, 8165\n"
                      "shl16insli r1, r1, 18793\n"
                      "shl16insli r1, r1, -22214\n"
                      "shl16insli r1, r1, 5498\n"
                      "moveli r10, 31115\n"
                      "shl16insli r10, r10, -26645\n"
                      "shl16insli r10, r10, -28059\n"
                      "shl16insli r10, r10, -26401\n"
                      "move r10, %2\n"
                      "{ fnop  ; ldnt1u r1, r10  }\n"
                      "move %0, r1\n"
                      "move %1, r10\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
