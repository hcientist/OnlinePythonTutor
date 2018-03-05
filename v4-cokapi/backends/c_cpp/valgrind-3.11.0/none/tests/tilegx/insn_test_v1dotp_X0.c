//file: _insn_test_v1dotp_X0.c
//op=251
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

unsigned long mem[2] = { 0x7b812106b9ba177f, 0xa91bb9da3e399735 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -2452\n"
                      "shl16insli r3, r3, -32096\n"
                      "shl16insli r3, r3, -11540\n"
                      "shl16insli r3, r3, 18694\n"
                      "moveli r42, -335\n"
                      "shl16insli r42, r42, -26011\n"
                      "shl16insli r42, r42, -23631\n"
                      "shl16insli r42, r42, -1594\n"
                      "moveli r44, -16908\n"
                      "shl16insli r44, r44, -28320\n"
                      "shl16insli r44, r44, 5956\n"
                      "shl16insli r44, r44, 28904\n"
                      "{ v1dotp r3, r42, r44 ; fnop   }\n"
                      "move %0, r3\n"
                      "move %1, r42\n"
                      "move %2, r44\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
