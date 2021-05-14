//file: _insn_test_ldnt1s_X1.c
//op=136
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

unsigned long mem[2] = { 0x25733d8b5dc477b4, 0x820d15cd622148e4 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r49, 25551\n"
                      "shl16insli r49, r49, 28722\n"
                      "shl16insli r49, r49, -26847\n"
                      "shl16insli r49, r49, 5345\n"
                      "moveli r33, -29477\n"
                      "shl16insli r33, r33, 10834\n"
                      "shl16insli r33, r33, -26605\n"
                      "shl16insli r33, r33, 14005\n"
                      "move r33, %2\n"
                      "{ fnop  ; ldnt1s r49, r33  }\n"
                      "move %0, r49\n"
                      "move %1, r33\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
