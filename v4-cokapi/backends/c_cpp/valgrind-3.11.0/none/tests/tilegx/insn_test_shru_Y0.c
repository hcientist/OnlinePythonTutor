//file: _insn_test_shru_Y0.c
//op=201
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

unsigned long mem[2] = { 0x55fc49dd464ad867, 0xa2f896884ed05e90 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r38, -32745\n"
                      "shl16insli r38, r38, -15929\n"
                      "shl16insli r38, r38, -787\n"
                      "shl16insli r38, r38, 26982\n"
                      "moveli r21, 11986\n"
                      "shl16insli r21, r21, 6051\n"
                      "shl16insli r21, r21, 28164\n"
                      "shl16insli r21, r21, -14685\n"
                      "moveli r41, -32304\n"
                      "shl16insli r41, r41, 5880\n"
                      "shl16insli r41, r41, 26751\n"
                      "shl16insli r41, r41, 15077\n"
                      "{ shru r38, r21, r41 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r38\n"
                      "move %1, r21\n"
                      "move %2, r41\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
