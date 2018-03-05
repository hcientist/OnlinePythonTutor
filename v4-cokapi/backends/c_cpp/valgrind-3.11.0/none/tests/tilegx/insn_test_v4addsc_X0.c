//file: _insn_test_v4addsc_X0.c
//op=322
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

unsigned long mem[2] = { 0xd4a558c5b71d713e, 0x4639d63ca03e5e4e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, 5393\n"
                      "shl16insli r35, r35, -22253\n"
                      "shl16insli r35, r35, 25749\n"
                      "shl16insli r35, r35, -7203\n"
                      "moveli r9, 21658\n"
                      "shl16insli r9, r9, 7462\n"
                      "shl16insli r9, r9, -214\n"
                      "shl16insli r9, r9, -426\n"
                      "moveli r15, -17213\n"
                      "shl16insli r15, r15, 15408\n"
                      "shl16insli r15, r15, -28656\n"
                      "shl16insli r15, r15, 10623\n"
                      "{ v4addsc r35, r9, r15 ; fnop   }\n"
                      "move %0, r35\n"
                      "move %1, r9\n"
                      "move %2, r15\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
