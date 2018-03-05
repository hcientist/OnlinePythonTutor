//file: _insn_test_tblidxb2_Y0.c
//op=231
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

unsigned long mem[2] = { 0x6d113c22a94d65e4, 0x400c09fcfb9b518b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r48, -831\n"
                      "shl16insli r48, r48, -21707\n"
                      "shl16insli r48, r48, 21243\n"
                      "shl16insli r48, r48, 32630\n"
                      "moveli r45, 5379\n"
                      "shl16insli r45, r45, 17793\n"
                      "shl16insli r45, r45, 30101\n"
                      "shl16insli r45, r45, 16122\n"
                      "{ tblidxb2 r48, r45 ; fnop  ; ld r63, r54  }\n"
                      "move %0, r48\n"
                      "move %1, r45\n"
                      :"=r"(a[0]),"=r"(a[1]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
