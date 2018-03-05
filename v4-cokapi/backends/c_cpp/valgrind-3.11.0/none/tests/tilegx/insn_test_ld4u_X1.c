//file: _insn_test_ld4u_X1.c
//op=130
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

unsigned long mem[2] = { 0xb002a7dc1c538d17, 0x553c16d3559d1cee };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, 20445\n"
                      "shl16insli r46, r46, -17976\n"
                      "shl16insli r46, r46, -29438\n"
                      "shl16insli r46, r46, -12912\n"
                      "moveli r2, 6570\n"
                      "shl16insli r2, r2, -30096\n"
                      "shl16insli r2, r2, -3418\n"
                      "shl16insli r2, r2, 9405\n"
                      "move r2, %2\n"
                      "{ fnop  ; ld4u r46, r2  }\n"
                      "move %0, r46\n"
                      "move %1, r2\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
