//file: _insn_test_ld2s_X1.c
//op=124
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

unsigned long mem[2] = { 0x6d228375c43e27fe, 0x6a0cb98ab56a8e60 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r18, -2019\n"
                      "shl16insli r18, r18, 30837\n"
                      "shl16insli r18, r18, -1194\n"
                      "shl16insli r18, r18, -12623\n"
                      "moveli r46, -17868\n"
                      "shl16insli r46, r46, -15637\n"
                      "shl16insli r46, r46, -21854\n"
                      "shl16insli r46, r46, 31769\n"
                      "move r46, %2\n"
                      "{ fnop  ; ld2s r18, r46  }\n"
                      "move %0, r18\n"
                      "move %1, r46\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
