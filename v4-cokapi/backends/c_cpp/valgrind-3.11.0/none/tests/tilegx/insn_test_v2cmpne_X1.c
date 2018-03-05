//file: _insn_test_v2cmpne_X1.c
//op=291
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

unsigned long mem[2] = { 0x73bf93bc04d834da, 0x76a2823539bdf579 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r22, -12324\n"
                      "shl16insli r22, r22, -28627\n"
                      "shl16insli r22, r22, 16604\n"
                      "shl16insli r22, r22, -17536\n"
                      "moveli r4, -7766\n"
                      "shl16insli r4, r4, 5697\n"
                      "shl16insli r4, r4, 28357\n"
                      "shl16insli r4, r4, -6412\n"
                      "moveli r17, 864\n"
                      "shl16insli r17, r17, 29519\n"
                      "shl16insli r17, r17, 2450\n"
                      "shl16insli r17, r17, -17857\n"
                      "{ fnop  ; v2cmpne r22, r4, r17  }\n"
                      "move %0, r22\n"
                      "move %1, r4\n"
                      "move %2, r17\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
