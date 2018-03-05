//file: _insn_test_cmoveqz_X0.c
//op=51
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

unsigned long mem[2] = { 0x8e9efd621a0271c0, 0xe6fd0819cb489949 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r50, -2571\n"
                      "shl16insli r50, r50, 10073\n"
                      "shl16insli r50, r50, -8744\n"
                      "shl16insli r50, r50, 32440\n"
                      "moveli r28, -14135\n"
                      "shl16insli r28, r28, -9714\n"
                      "shl16insli r28, r28, -28553\n"
                      "shl16insli r28, r28, 1624\n"
                      "moveli r42, -6121\n"
                      "shl16insli r42, r42, -23936\n"
                      "shl16insli r42, r42, -6621\n"
                      "shl16insli r42, r42, -11778\n"
                      "{ cmoveqz r50, r28, r42 ; fnop   }\n"
                      "move %0, r50\n"
                      "move %1, r28\n"
                      "move %2, r42\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
