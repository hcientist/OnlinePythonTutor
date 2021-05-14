//file: _insn_test_stnt4_X1.c
//op=219
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

unsigned long mem[2] = { 0x9275ba799534a7f9, 0x6745e72a91ff67c2 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r40, -1549\n"
                      "shl16insli r40, r40, 17842\n"
                      "shl16insli r40, r40, 24501\n"
                      "shl16insli r40, r40, -29822\n"
                      "moveli r41, 17684\n"
                      "shl16insli r41, r41, 2987\n"
                      "shl16insli r41, r41, 15358\n"
                      "shl16insli r41, r41, 2277\n"
                      "move r40, %2\n"
                      "{ fnop  ; stnt4 r40, r41  }\n"
                      "move %0, r40\n"
                      "move %1, r41\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
