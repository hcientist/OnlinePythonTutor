//file: _insn_test_ldnt2u_add_X1.c
//op=143
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

unsigned long mem[2] = { 0x59fad680489ec628, 0xc20f490a26161c01 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r30, 16120\n"
                      "shl16insli r30, r30, -22959\n"
                      "shl16insli r30, r30, 22252\n"
                      "shl16insli r30, r30, 172\n"
                      "moveli r2, -28491\n"
                      "shl16insli r2, r2, 5201\n"
                      "shl16insli r2, r2, 4373\n"
                      "shl16insli r2, r2, 26208\n"
                      "move r2, %2\n"
                      "{ fnop  ; ldnt2u_add r30, r2, -25  }\n"
                      "move %0, r30\n"
                      "move %1, r2\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
