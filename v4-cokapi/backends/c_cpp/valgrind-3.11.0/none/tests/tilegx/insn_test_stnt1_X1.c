//file: _insn_test_stnt1_X1.c
//op=215
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

unsigned long mem[2] = { 0x40001b1a5c71f305, 0x9355b6a95b9dd621 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r33, -20990\n"
                      "shl16insli r33, r33, -3887\n"
                      "shl16insli r33, r33, 1674\n"
                      "shl16insli r33, r33, 11807\n"
                      "moveli r21, 13070\n"
                      "shl16insli r21, r21, 14309\n"
                      "shl16insli r21, r21, -28472\n"
                      "shl16insli r21, r21, 23329\n"
                      "move r33, %2\n"
                      "{ fnop  ; stnt1 r33, r21  }\n"
                      "move %0, r33\n"
                      "move %1, r21\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
