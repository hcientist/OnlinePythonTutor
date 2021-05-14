//file: _insn_test_fdouble_pack1_X0.c
//op=85
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

unsigned long mem[2] = { 0x8a6bdf08a51f10d3, 0xbb06a702206f99b2 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r28, 31787\n"
                      "shl16insli r28, r28, 188\n"
                      "shl16insli r28, r28, -30112\n"
                      "shl16insli r28, r28, -13987\n"
                      "moveli r28, -217\n"
                      "shl16insli r28, r28, -31069\n"
                      "shl16insli r28, r28, 14592\n"
                      "shl16insli r28, r28, 26557\n"
                      "moveli r26, -8315\n"
                      "shl16insli r26, r26, 5404\n"
                      "shl16insli r26, r26, 15177\n"
                      "shl16insli r26, r26, -6931\n"
                      "{ fdouble_pack1 r28, r28, r26 ; fnop   }\n"
                      "move %0, r28\n"
                      "move %1, r28\n"
                      "move %2, r26\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
