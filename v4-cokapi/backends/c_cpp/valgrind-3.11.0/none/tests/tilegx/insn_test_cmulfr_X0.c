//file: _insn_test_cmulfr_X0.c
//op=68
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

unsigned long mem[2] = { 0x820d15cd622148e4, 0x7eda32ada2f5060 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r39, 9587\n"
                      "shl16insli r39, r39, 15755\n"
                      "shl16insli r39, r39, 24004\n"
                      "shl16insli r39, r39, 30644\n"
                      "moveli r16, -6121\n"
                      "shl16insli r16, r16, -23936\n"
                      "shl16insli r16, r16, -6621\n"
                      "shl16insli r16, r16, -11778\n"
                      "moveli r25, 25551\n"
                      "shl16insli r25, r25, 28722\n"
                      "shl16insli r25, r25, -26847\n"
                      "shl16insli r25, r25, 5345\n"
                      "{ cmulfr r39, r16, r25 ; fnop   }\n"
                      "move %0, r39\n"
                      "move %1, r16\n"
                      "move %2, r25\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
