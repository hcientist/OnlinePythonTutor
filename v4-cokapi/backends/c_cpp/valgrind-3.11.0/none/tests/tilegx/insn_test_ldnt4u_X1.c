//file: _insn_test_ldnt4u_X1.c
//op=146
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

unsigned long mem[2] = { 0x52c49809e5465b06, 0xea70c8b3ffd336c3 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r14, 27619\n"
                      "shl16insli r14, r14, 17289\n"
                      "shl16insli r14, r14, 12105\n"
                      "shl16insli r14, r14, -30968\n"
                      "moveli r34, -1549\n"
                      "shl16insli r34, r34, 17842\n"
                      "shl16insli r34, r34, 24501\n"
                      "shl16insli r34, r34, -29822\n"
                      "move r34, %2\n"
                      "{ fnop  ; ldnt4u r14, r34  }\n"
                      "move %0, r14\n"
                      "move %1, r34\n"
                      :"=r"(a[0]),"=r"(a[1]) : "r"(mem));
    printf("%016lx %016lx\n", mem[0], mem[1]);
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    return 0;
}
