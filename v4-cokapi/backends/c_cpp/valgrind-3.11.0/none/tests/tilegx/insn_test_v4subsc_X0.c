//file: _insn_test_v4subsc_X0.c
//op=331
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

unsigned long mem[2] = { 0x92adb447873201ff, 0xd36a8d07bde44b83 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r42, 30010\n"
                      "shl16insli r42, r42, 8476\n"
                      "shl16insli r42, r42, 20122\n"
                      "shl16insli r42, r42, -20634\n"
                      "moveli r44, 26115\n"
                      "shl16insli r44, r44, 9284\n"
                      "shl16insli r44, r44, 29287\n"
                      "shl16insli r44, r44, 8638\n"
                      "moveli r29, 19275\n"
                      "shl16insli r29, r29, -29979\n"
                      "shl16insli r29, r29, 31395\n"
                      "shl16insli r29, r29, -21694\n"
                      "{ v4subsc r42, r44, r29 ; fnop   }\n"
                      "move %0, r42\n"
                      "move %1, r44\n"
                      "move %2, r29\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
