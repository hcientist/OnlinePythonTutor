//file: _insn_test_v1cmples_X1.c
//op=240
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

unsigned long mem[2] = { 0x9cc2101465cdabcc, 0xfd529a461f919c3b };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r30, -398\n"
                      "shl16insli r30, r30, 9724\n"
                      "shl16insli r30, r30, -28764\n"
                      "shl16insli r30, r30, 25983\n"
                      "moveli r39, -18162\n"
                      "shl16insli r39, r39, 4413\n"
                      "shl16insli r39, r39, 14247\n"
                      "shl16insli r39, r39, 14892\n"
                      "moveli r9, 10415\n"
                      "shl16insli r9, r9, -24373\n"
                      "shl16insli r9, r9, 23725\n"
                      "shl16insli r9, r9, -29919\n"
                      "{ fnop  ; v1cmples r30, r39, r9  }\n"
                      "move %0, r30\n"
                      "move %1, r39\n"
                      "move %2, r9\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
