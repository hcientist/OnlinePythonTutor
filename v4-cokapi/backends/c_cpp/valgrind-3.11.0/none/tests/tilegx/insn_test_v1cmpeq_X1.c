//file: _insn_test_v1cmpeq_X1.c
//op=238
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

unsigned long mem[2] = { 0xbc7e18adc4f4bcd4, 0xdd853a2377c4c1cd };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r3, -28260\n"
                      "shl16insli r3, r3, -3800\n"
                      "shl16insli r3, r3, 26206\n"
                      "shl16insli r3, r3, 20590\n"
                      "moveli r43, -7555\n"
                      "shl16insli r43, r43, -10473\n"
                      "shl16insli r43, r43, 1769\n"
                      "shl16insli r43, r43, 20859\n"
                      "moveli r22, 31720\n"
                      "shl16insli r22, r22, -26184\n"
                      "shl16insli r22, r22, -29280\n"
                      "shl16insli r22, r22, 21783\n"
                      "{ fnop  ; v1cmpeq r3, r43, r22  }\n"
                      "move %0, r3\n"
                      "move %1, r43\n"
                      "move %2, r22\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
