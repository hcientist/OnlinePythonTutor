//file: _insn_test_v1shru_X1.c
//op=274
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

unsigned long mem[2] = { 0x9e4137a4fbfd19fc, 0xe11d6a52db1557dd };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r19, -27667\n"
                      "shl16insli r19, r19, -7882\n"
                      "shl16insli r19, r19, 17186\n"
                      "shl16insli r19, r19, 17173\n"
                      "moveli r1, 31681\n"
                      "shl16insli r1, r1, 6366\n"
                      "shl16insli r1, r1, -2389\n"
                      "shl16insli r1, r1, 19110\n"
                      "moveli r25, 16926\n"
                      "shl16insli r25, r25, -28231\n"
                      "shl16insli r25, r25, -13659\n"
                      "shl16insli r25, r25, 19027\n"
                      "{ fnop  ; v1shru r19, r1, r25  }\n"
                      "move %0, r19\n"
                      "move %1, r1\n"
                      "move %2, r25\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
