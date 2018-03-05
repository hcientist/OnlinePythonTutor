//file: _insn_test_st1_X1.c
//op=207
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

unsigned long mem[2] = { 0xd8cf3760900235c5, 0x4e5b0c323c359e88 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r17, 31115\n"
                      "shl16insli r17, r17, -26645\n"
                      "shl16insli r17, r17, -28059\n"
                      "shl16insli r17, r17, -26401\n"
                      "moveli r40, -23165\n"
                      "shl16insli r40, r40, 1139\n"
                      "shl16insli r40, r40, -11511\n"
                      "shl16insli r40, r40, -24395\n"
                      "move r17, %2\n"
                      "{ fnop  ; st1 r17, r40  }\n"
                      "move %0, r17\n"
                      "move %1, r40\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
