//file: _insn_test_addx_Y1.c
//op=25
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

unsigned long mem[2] = { 0xa866c1efe28f7aab, 0x422260f8cf40ffbb };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r16, 16437\n"
                      "shl16insli r16, r16, -17949\n"
                      "shl16insli r16, r16, -5049\n"
                      "shl16insli r16, r16, 16324\n"
                      "moveli r19, 21012\n"
                      "shl16insli r19, r19, -29133\n"
                      "shl16insli r19, r19, -8710\n"
                      "shl16insli r19, r19, -16472\n"
                      "moveli r2, -10150\n"
                      "shl16insli r2, r2, -32553\n"
                      "shl16insli r2, r2, -18908\n"
                      "shl16insli r2, r2, 23364\n"
                      "{ fnop  ; addx r16, r19, r2 ; ld r63, r54  }\n"
                      "move %0, r16\n"
                      "move %1, r19\n"
                      "move %2, r2\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
