//file: _insn_test_ld4u_add_X1.c
//op=131
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

unsigned long mem[2] = { 0x7f88e5945a40e9ee, 0xe76171c85a64faf7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r31, -14377\n"
                      "shl16insli r31, r31, -7231\n"
                      "shl16insli r31, r31, -29806\n"
                      "shl16insli r31, r31, 3514\n"
                      "moveli r50, 16073\n"
                      "shl16insli r50, r50, -20366\n"
                      "shl16insli r50, r50, -10414\n"
                      "shl16insli r50, r50, 4096\n"
                      "move r50, %2\n"
                      "{ fnop  ; ld4u_add r31, r50, -16  }\n"
                      "move %0, r31\n"
                      "move %1, r50\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
