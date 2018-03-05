//file: _insn_test_v2add_X1.c
//op=278
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

unsigned long mem[2] = { 0x88b76c744163208a, 0xab1fe60bd5f86c0d };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -20701\n"
                      "shl16insli r48, r48, 19319\n"
                      "shl16insli r48, r48, -14144\n"
                      "shl16insli r48, r48, -17797\n"
                      "moveli r42, -26180\n"
                      "shl16insli r42, r42, -32480\n"
                      "shl16insli r42, r42, -16635\n"
                      "shl16insli r42, r42, -11404\n"
                      "moveli r12, 15399\n"
                      "shl16insli r12, r12, 19647\n"
                      "shl16insli r12, r12, -13624\n"
                      "shl16insli r12, r12, 29718\n"
                      "{ fnop  ; v2add r48, r42, r12  }\n"
                      "move %0, r48\n"
                      "move %1, r42\n"
                      "move %2, r12\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
