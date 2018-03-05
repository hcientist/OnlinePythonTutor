//file: _insn_test_shlxi_X0.c
//op=198
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

unsigned long mem[2] = { 0x3a5fb939d54b0205, 0xc4b573db7dcf1edb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r28, 27432\n"
                      "shl16insli r28, r28, -22439\n"
                      "shl16insli r28, r28, 15226\n"
                      "shl16insli r28, r28, -19568\n"
                      "moveli r27, -20710\n"
                      "shl16insli r27, r27, 2588\n"
                      "shl16insli r27, r27, -32310\n"
                      "shl16insli r27, r27, 10817\n"
                      "{ shlxi r28, r27, 58 ; fnop   }\n"
                      "move %0, r28\n"
                      "move %1, r27\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
