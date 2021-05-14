//file: _insn_test_v2mnz_X0.c
//op=300
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

unsigned long mem[2] = { 0x2998adb0884ca11c, 0x95953511f9ee4512 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r8, -25986\n"
                      "shl16insli r8, r8, -11739\n"
                      "shl16insli r8, r8, 13313\n"
                      "shl16insli r8, r8, -12374\n"
                      "moveli r5, 8557\n"
                      "shl16insli r5, r5, 20208\n"
                      "shl16insli r5, r5, -26295\n"
                      "shl16insli r5, r5, -27540\n"
                      "moveli r49, 24429\n"
                      "shl16insli r49, r49, 18925\n"
                      "shl16insli r49, r49, 30717\n"
                      "shl16insli r49, r49, -32703\n"
                      "{ v2mnz r8, r5, r49 ; fnop   }\n"
                      "move %0, r8\n"
                      "move %1, r5\n"
                      "move %2, r49\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
