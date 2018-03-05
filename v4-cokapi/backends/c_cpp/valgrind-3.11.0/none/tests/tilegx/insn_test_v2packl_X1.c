//file: _insn_test_v2packl_X1.c
//op=306
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

unsigned long mem[2] = { 0x6110cf64d9a1b913, 0xc8c9da0e90770658 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, 31329\n"
                      "shl16insli r45, r45, 2611\n"
                      "shl16insli r45, r45, -21984\n"
                      "shl16insli r45, r45, -27173\n"
                      "moveli r13, 29208\n"
                      "shl16insli r13, r13, -3828\n"
                      "shl16insli r13, r13, 13042\n"
                      "shl16insli r13, r13, 9981\n"
                      "moveli r40, 2094\n"
                      "shl16insli r40, r40, 8442\n"
                      "shl16insli r40, r40, -10144\n"
                      "shl16insli r40, r40, -21625\n"
                      "{ fnop  ; v2packl r45, r13, r40  }\n"
                      "move %0, r45\n"
                      "move %1, r13\n"
                      "move %2, r40\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
