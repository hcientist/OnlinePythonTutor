//file: _insn_test_ldnt1s_add_X1.c
//op=137
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

unsigned long mem[2] = { 0xe11d6a52db1557dd, 0x601a65b89d0791ab };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r46, -25023\n"
                      "shl16insli r46, r46, 14244\n"
                      "shl16insli r46, r46, -1027\n"
                      "shl16insli r46, r46, 6652\n"
                      "moveli r19, -22946\n"
                      "shl16insli r19, r19, -5784\n"
                      "shl16insli r19, r19, 19718\n"
                      "shl16insli r19, r19, -7802\n"
                      "move r19, %2\n"
                      "{ fnop  ; ldnt1s_add r46, r19, -111  }\n"
                      "move %0, r46\n"
                      "move %1, r19\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
