//file: _insn_test_v1minu_X1.c
//op=261
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

unsigned long mem[2] = { 0xe5ffde572843204c, 0xf80a73ea5b48cd2e };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -8159\n"
                      "shl16insli r48, r48, -19405\n"
                      "shl16insli r48, r48, -6882\n"
                      "shl16insli r48, r48, 24332\n"
                      "moveli r5, 588\n"
                      "shl16insli r5, r5, 25418\n"
                      "shl16insli r5, r5, -27674\n"
                      "shl16insli r5, r5, 2111\n"
                      "moveli r23, -19496\n"
                      "shl16insli r23, r23, -22831\n"
                      "shl16insli r23, r23, -22278\n"
                      "shl16insli r23, r23, 2692\n"
                      "{ fnop  ; v1minu r48, r5, r23  }\n"
                      "move %0, r48\n"
                      "move %1, r5\n"
                      "move %2, r23\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
