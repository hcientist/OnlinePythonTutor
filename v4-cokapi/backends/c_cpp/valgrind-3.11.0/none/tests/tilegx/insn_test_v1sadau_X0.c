//file: _insn_test_v1sadau_X0.c
//op=268
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

unsigned long mem[2] = { 0x75810b48447f8cd8, 0x2f3ac3e001892397 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r15, 16969\n"
                      "shl16insli r15, r15, 21355\n"
                      "shl16insli r15, r15, -13594\n"
                      "shl16insli r15, r15, 31543\n"
                      "moveli r46, -32304\n"
                      "shl16insli r46, r46, 5880\n"
                      "shl16insli r46, r46, 26751\n"
                      "shl16insli r46, r46, 15077\n"
                      "moveli r45, -22749\n"
                      "shl16insli r45, r45, -6105\n"
                      "shl16insli r45, r45, 23283\n"
                      "shl16insli r45, r45, 28386\n"
                      "{ v1sadau r15, r46, r45 ; fnop   }\n"
                      "move %0, r15\n"
                      "move %1, r46\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
