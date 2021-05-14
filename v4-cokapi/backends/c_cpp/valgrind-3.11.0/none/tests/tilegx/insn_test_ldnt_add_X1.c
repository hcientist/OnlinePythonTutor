//file: _insn_test_ldnt_add_X1.c
//op=148
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

unsigned long mem[2] = { 0xd67c5353b4f83951, 0x68fb6e92c7467995 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r34, -10637\n"
                      "shl16insli r34, r34, -13587\n"
                      "shl16insli r34, r34, 6072\n"
                      "shl16insli r34, r34, -2381\n"
                      "moveli r42, -31836\n"
                      "shl16insli r42, r42, -15605\n"
                      "shl16insli r42, r42, -32767\n"
                      "shl16insli r42, r42, -3062\n"
                      "move r42, %2\n"
                      "{ fnop  ; ldnt_add r34, r42, 11  }\n"
                      "move %0, r34\n"
                      "move %1, r42\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
