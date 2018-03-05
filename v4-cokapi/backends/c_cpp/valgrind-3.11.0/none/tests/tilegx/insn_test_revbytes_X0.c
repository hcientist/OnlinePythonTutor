//file: _insn_test_revbytes_X0.c
//op=185
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

unsigned long mem[2] = { 0x8855e8634340c3dd, 0x83fe56474a5b5a36 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, 2393\n"
                      "shl16insli r38, r38, 12415\n"
                      "shl16insli r38, r38, -29425\n"
                      "shl16insli r38, r38, -12730\n"
                      "moveli r41, -12869\n"
                      "shl16insli r41, r41, -19528\n"
                      "shl16insli r41, r41, 27018\n"
                      "shl16insli r41, r41, -20432\n"
                      "{ revbytes r38, r41 ; fnop   }\n"
                      "move %0, r38\n"
                      "move %1, r41\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
