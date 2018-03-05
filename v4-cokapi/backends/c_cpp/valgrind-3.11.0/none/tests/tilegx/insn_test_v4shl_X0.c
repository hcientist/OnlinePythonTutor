//file: _insn_test_v4shl_X0.c
//op=326
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

unsigned long mem[2] = { 0xb3c4aad383be7970, 0xcdce8cd30da8f45b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, 25062\n"
                      "shl16insli r34, r34, -3688\n"
                      "shl16insli r34, r34, 15670\n"
                      "shl16insli r34, r34, 15480\n"
                      "moveli r41, 6763\n"
                      "shl16insli r41, r41, -31823\n"
                      "shl16insli r41, r41, 3289\n"
                      "shl16insli r41, r41, 2018\n"
                      "moveli r35, -12490\n"
                      "shl16insli r35, r35, 25114\n"
                      "shl16insli r35, r35, -6270\n"
                      "shl16insli r35, r35, -17183\n"
                      "{ v4shl r34, r41, r35 ; fnop   }\n"
                      "move %0, r34\n"
                      "move %1, r41\n"
                      "move %2, r35\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
