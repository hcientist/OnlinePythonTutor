//file: _insn_test_fsingle_add1_X0.c
//op=102
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

unsigned long mem[2] = { 0xf5f52759ddd87eb8, 0x8e9efd621a0271c0 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r21, -6121\n"
                      "shl16insli r21, r21, -23936\n"
                      "shl16insli r21, r21, -6621\n"
                      "shl16insli r21, r21, -11778\n"
                      "moveli r22, 24848\n"
                      "shl16insli r22, r22, -12444\n"
                      "shl16insli r22, r22, -9823\n"
                      "shl16insli r22, r22, -18157\n"
                      "moveli r3, -29477\n"
                      "shl16insli r3, r3, 10834\n"
                      "shl16insli r3, r3, -26605\n"
                      "shl16insli r3, r3, 14005\n"
                      "{ fsingle_add1 r21, r22, r3 ; fnop   }\n"
                      "move %0, r21\n"
                      "move %1, r22\n"
                      "move %2, r3\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
