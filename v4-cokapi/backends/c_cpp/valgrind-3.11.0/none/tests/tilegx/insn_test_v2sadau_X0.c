//file: _insn_test_v2sadau_X0.c
//op=309
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

unsigned long mem[2] = { 0xa3379eed107d409b, 0xb774c986061d211c };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r47, -14930\n"
                      "shl16insli r47, r47, -27555\n"
                      "shl16insli r47, r47, -15233\n"
                      "shl16insli r47, r47, -7776\n"
                      "moveli r46, 28855\n"
                      "shl16insli r46, r46, 12220\n"
                      "shl16insli r46, r46, -21108\n"
                      "shl16insli r46, r46, 22056\n"
                      "moveli r28, -20567\n"
                      "shl16insli r28, r28, -30793\n"
                      "shl16insli r28, r28, -6577\n"
                      "shl16insli r28, r28, -29356\n"
                      "{ v2sadau r47, r46, r28 ; fnop   }\n"
                      "move %0, r47\n"
                      "move %1, r46\n"
                      "move %2, r28\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
