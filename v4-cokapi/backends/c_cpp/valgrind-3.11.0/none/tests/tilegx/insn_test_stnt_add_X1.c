//file: _insn_test_stnt_add_X1.c
//op=221
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

unsigned long mem[2] = { 0x8886d34e2ec2c46, 0x31537bc8fa0b780a };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, 27578\n"
                      "shl16insli r13, r13, -12921\n"
                      "shl16insli r13, r13, 10612\n"
                      "shl16insli r13, r13, -6350\n"
                      "moveli r38, -29644\n"
                      "shl16insli r38, r38, -25434\n"
                      "shl16insli r38, r38, -11296\n"
                      "shl16insli r38, r38, -14614\n"
                      "move r13, %2\n"
                      "{ fnop  ; stnt_add r13, r38, -75  }\n"
                      "move %0, r13\n"
                      "move %1, r38\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
