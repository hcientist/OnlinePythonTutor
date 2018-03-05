//file: _insn_test_st_X1.c
//op=206
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

unsigned long mem[2] = { 0xdf38a6238f47ee5b, 0x2c24dd020e9fa33f };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r4, -2884\n"
                      "shl16insli r4, r4, 28785\n"
                      "shl16insli r4, r4, 7136\n"
                      "shl16insli r4, r4, 32281\n"
                      "moveli r7, -14930\n"
                      "shl16insli r7, r7, -27555\n"
                      "shl16insli r7, r7, -15233\n"
                      "shl16insli r7, r7, -7776\n"
                      "move r4, %2\n"
                      "{ fnop  ; st r4, r7  }\n"
                      "move %0, r4\n"
                      "move %1, r7\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
