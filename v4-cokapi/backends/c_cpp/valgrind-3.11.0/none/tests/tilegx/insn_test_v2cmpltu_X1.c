//file: _insn_test_v2cmpltu_X1.c
//op=289
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

unsigned long mem[2] = { 0x5bebf9affeed58c5, 0x5f48984c90970726 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, -4172\n"
                      "shl16insli r17, r17, 3357\n"
                      "shl16insli r17, r17, 24413\n"
                      "shl16insli r17, r17, -20526\n"
                      "moveli r27, 301\n"
                      "shl16insli r27, r27, -10739\n"
                      "shl16insli r27, r27, -13582\n"
                      "shl16insli r27, r27, 11244\n"
                      "moveli r10, 9533\n"
                      "shl16insli r10, r10, -1340\n"
                      "shl16insli r10, r10, -4688\n"
                      "shl16insli r10, r10, 849\n"
                      "{ fnop  ; v2cmpltu r17, r27, r10  }\n"
                      "move %0, r17\n"
                      "move %1, r27\n"
                      "move %2, r10\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
