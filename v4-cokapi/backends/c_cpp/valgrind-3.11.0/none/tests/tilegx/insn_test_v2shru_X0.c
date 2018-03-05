//file: _insn_test_v2shru_X0.c
//op=317
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

unsigned long mem[2] = { 0x57bcf4c2092d9b7c, 0xf0b9de77e27316a4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r50, 5090\n"
                      "shl16insli r50, r50, -3949\n"
                      "shl16insli r50, r50, -32171\n"
                      "shl16insli r50, r50, -2954\n"
                      "moveli r25, -17595\n"
                      "shl16insli r25, r25, 2853\n"
                      "shl16insli r25, r25, -2027\n"
                      "shl16insli r25, r25, 1813\n"
                      "moveli r0, 31428\n"
                      "shl16insli r0, r0, -7946\n"
                      "shl16insli r0, r0, -26525\n"
                      "shl16insli r0, r0, -15747\n"
                      "{ v2shru r50, r25, r0 ; fnop   }\n"
                      "move %0, r50\n"
                      "move %1, r25\n"
                      "move %2, r0\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
