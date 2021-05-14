//file: _insn_test_rotl_X1.c
//op=186
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

unsigned long mem[2] = { 0x9b125b6641bb9f39, 0x90ce422b64edc869 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r43, -17868\n"
                      "shl16insli r43, r43, -15637\n"
                      "shl16insli r43, r43, -21854\n"
                      "shl16insli r43, r43, 31769\n"
                      "moveli r22, -19055\n"
                      "shl16insli r22, r22, -26082\n"
                      "shl16insli r22, r22, -18335\n"
                      "shl16insli r22, r22, -26425\n"
                      "moveli r43, -28917\n"
                      "shl16insli r43, r43, -6384\n"
                      "shl16insli r43, r43, -11771\n"
                      "shl16insli r43, r43, -16008\n"
                      "{ fnop  ; rotl r43, r22, r43  }\n"
                      "move %0, r43\n"
                      "move %1, r22\n"
                      "move %2, r43\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
