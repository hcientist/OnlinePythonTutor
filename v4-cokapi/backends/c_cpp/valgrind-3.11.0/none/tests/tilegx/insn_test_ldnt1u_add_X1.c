//file: _insn_test_ldnt1u_add_X1.c
//op=139
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

unsigned long mem[2] = { 0xab1fe60bd5f86c0d, 0xd3191cdcf9681de6 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -30537\n"
                      "shl16insli r32, r32, 27764\n"
                      "shl16insli r32, r32, 16739\n"
                      "shl16insli r32, r32, 8330\n"
                      "moveli r3, -26924\n"
                      "shl16insli r3, r3, -3594\n"
                      "shl16insli r3, r3, -24949\n"
                      "shl16insli r3, r3, 31134\n"
                      "move r3, %2\n"
                      "{ fnop  ; ldnt1u_add r32, r3, 90  }\n"
                      "move %0, r32\n"
                      "move %1, r3\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
