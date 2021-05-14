//file: _insn_test_st2_Y2.c
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
                      "moveli r27, 31479\n"
                      "shl16insli r27, r27, 14417\n"
                      "shl16insli r27, r27, -15390\n"
                      "shl16insli r27, r27, -30051\n"
                      "moveli r21, -26026\n"
                      "shl16insli r21, r21, 10353\n"
                      "shl16insli r21, r21, 13698\n"
                      "shl16insli r21, r21, 29702\n"
                      "move r27, %2\n"
                      "{ fnop  ; fnop  ; st2 r27, r21  }\n"
                      "move %0, r27\n"
                      "move %1, r21\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
