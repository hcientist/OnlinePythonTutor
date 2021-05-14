//file: _insn_test_add_Y1.c
//op=22
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

unsigned long mem[2] = { 0xcbf6dda12670067, 0x15063831748c3911 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r35, -22068\n"
                      "shl16insli r35, r35, -316\n"
                      "shl16insli r35, r35, -2663\n"
                      "shl16insli r35, r35, 29773\n"
                      "moveli r25, 14446\n"
                      "shl16insli r25, r25, 26605\n"
                      "shl16insli r25, r25, 31496\n"
                      "shl16insli r25, r25, -24631\n"
                      "moveli r34, -21610\n"
                      "shl16insli r34, r34, 7292\n"
                      "shl16insli r34, r34, -8245\n"
                      "shl16insli r34, r34, 30416\n"
                      "{ fnop  ; add r35, r25, r34 ; ld r63, r54  }\n"
                      "move %0, r35\n"
                      "move %1, r25\n"
                      "move %2, r34\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
