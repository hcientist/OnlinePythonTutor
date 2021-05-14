//file: _insn_test_fsingle_sub1_X0.c
//op=108
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

unsigned long mem[2] = { 0x8d6611e2e0188d4d, 0xc051e6bca12058e0 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r18, -32379\n"
                      "shl16insli r18, r18, -17242\n"
                      "shl16insli r18, r18, -8818\n"
                      "shl16insli r18, r18, 7579\n"
                      "moveli r22, 9145\n"
                      "shl16insli r22, r22, 16129\n"
                      "shl16insli r22, r22, -28988\n"
                      "shl16insli r22, r22, -28265\n"
                      "moveli r4, 23316\n"
                      "shl16insli r4, r4, 27509\n"
                      "shl16insli r4, r4, 21179\n"
                      "shl16insli r4, r4, 13422\n"
                      "{ fsingle_sub1 r18, r22, r4 ; fnop   }\n"
                      "move %0, r18\n"
                      "move %1, r22\n"
                      "move %2, r4\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
