//file: _insn_test_v1cmpne_X1.c
//op=246
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

unsigned long mem[2] = { 0x333c2ba4f5fc0778, 0x71782df005cc3618 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r12, -4257\n"
                      "shl16insli r12, r12, 16637\n"
                      "shl16insli r12, r12, -13862\n"
                      "shl16insli r12, r12, 2993\n"
                      "moveli r28, 19170\n"
                      "shl16insli r28, r28, -5999\n"
                      "shl16insli r28, r28, 20031\n"
                      "shl16insli r28, r28, -9404\n"
                      "moveli r13, 24886\n"
                      "shl16insli r13, r13, 6119\n"
                      "shl16insli r13, r13, -23856\n"
                      "shl16insli r13, r13, -8685\n"
                      "{ fnop  ; v1cmpne r12, r28, r13  }\n"
                      "move %0, r12\n"
                      "move %1, r28\n"
                      "move %2, r13\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
