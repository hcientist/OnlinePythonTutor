//file: _insn_test_v2mins_X0.c
//op=298
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

unsigned long mem[2] = { 0xa3dc241c7d6d8a40, 0x74d04934d1d15274 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, -6438\n"
                      "shl16insli r11, r11, 23407\n"
                      "shl16insli r11, r11, -8776\n"
                      "shl16insli r11, r11, -3925\n"
                      "moveli r49, -16630\n"
                      "shl16insli r49, r49, 3480\n"
                      "shl16insli r49, r49, -23548\n"
                      "shl16insli r49, r49, -31140\n"
                      "moveli r31, 15345\n"
                      "shl16insli r31, r31, 9943\n"
                      "shl16insli r31, r31, 20819\n"
                      "shl16insli r31, r31, 16223\n"
                      "{ v2mins r11, r49, r31 ; fnop   }\n"
                      "move %0, r11\n"
                      "move %1, r49\n"
                      "move %2, r31\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
