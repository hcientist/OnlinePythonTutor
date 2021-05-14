//file: _insn_test_ldnt4s_X1.c
//op=144
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

unsigned long mem[2] = { 0xfa50dcf0b044d59a, 0x48fd1654a7e669f7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r41, 26010\n"
                      "shl16insli r41, r41, -10170\n"
                      "shl16insli r41, r41, -10239\n"
                      "shl16insli r41, r41, -24168\n"
                      "moveli r30, 23316\n"
                      "shl16insli r30, r30, 27509\n"
                      "shl16insli r30, r30, 21179\n"
                      "shl16insli r30, r30, 13422\n"
                      "move r30, %2\n"
                      "{ fnop  ; ldnt4s r41, r30  }\n"
                      "move %0, r41\n"
                      "move %1, r30\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
