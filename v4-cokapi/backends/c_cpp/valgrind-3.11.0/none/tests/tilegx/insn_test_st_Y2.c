//file: _insn_test_st_Y2.c
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
                      "moveli r29, -2884\n"
                      "shl16insli r29, r29, 28785\n"
                      "shl16insli r29, r29, 7136\n"
                      "shl16insli r29, r29, 32281\n"
                      "moveli r6, -14930\n"
                      "shl16insli r6, r6, -27555\n"
                      "shl16insli r6, r6, -15233\n"
                      "shl16insli r6, r6, -7776\n"
                      "move r29, %2\n"
                      "{ fnop  ; fnop  ; st r29, r6  }\n"
                      "move %0, r29\n"
                      "move %1, r6\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
