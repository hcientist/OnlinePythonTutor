//file: _insn_test_ldnt_X1.c
//op=135
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

unsigned long mem[2] = { 0x8f37eee6381b10aa, 0xa536cafeb2fbe757 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r18, -5987\n"
                      "shl16insli r18, r18, -16935\n"
                      "shl16insli r18, r18, 638\n"
                      "shl16insli r18, r18, 32300\n"
                      "moveli r2, -15250\n"
                      "shl16insli r2, r2, 18129\n"
                      "shl16insli r2, r2, -22479\n"
                      "shl16insli r2, r2, 7405\n"
                      "move r2, %2\n"
                      "{ fnop  ; ldnt r18, r2  }\n"
                      "move %0, r18\n"
                      "move %1, r2\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
