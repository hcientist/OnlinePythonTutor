//file: _insn_test_st2_X1.c
//op=209
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

unsigned long mem[2] = { 0xd28f375e560f9e91, 0x155a9a746b0baf };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r29, 31479\n"
                      "shl16insli r29, r29, 14417\n"
                      "shl16insli r29, r29, -15390\n"
                      "shl16insli r29, r29, -30051\n"
                      "moveli r11, -26026\n"
                      "shl16insli r11, r11, 10353\n"
                      "shl16insli r11, r11, 13698\n"
                      "shl16insli r11, r11, 29702\n"
                      "move r29, %2\n"
                      "{ fnop  ; st2 r29, r11  }\n"
                      "move %0, r29\n"
                      "move %1, r11\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
