//file: _insn_test_ld1s_Y2.c
//op=120
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

unsigned long mem[2] = { 0xfd529a461f919c3b, 0xa702a184ea8a31f7 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r11, -25406\n"
                      "shl16insli r11, r11, 4116\n"
                      "shl16insli r11, r11, 26061\n"
                      "shl16insli r11, r11, -21556\n"
                      "moveli r20, 9517\n"
                      "shl16insli r20, r20, -14743\n"
                      "shl16insli r20, r20, 28886\n"
                      "shl16insli r20, r20, 23646\n"
                      "move r20, %2\n"
                      "{ fnop  ; fnop  ; ld1s r11, r20  }\n"
                      "move %0, r11\n"
                      "move %1, r20\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
