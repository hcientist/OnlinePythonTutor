//file: _insn_test_v4int_h_X0.c
//op=323
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

unsigned long mem[2] = { 0x41bcf962c564feb9, 0xdaeccac706283a05 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r13, -28418\n"
                      "shl16insli r13, r13, 24424\n"
                      "shl16insli r13, r13, 6148\n"
                      "shl16insli r13, r13, -14231\n"
                      "moveli r43, -26849\n"
                      "shl16insli r43, r43, 4171\n"
                      "shl16insli r43, r43, -14537\n"
                      "shl16insli r43, r43, -11074\n"
                      "moveli r45, 356\n"
                      "shl16insli r45, r45, 21071\n"
                      "shl16insli r45, r45, -4609\n"
                      "shl16insli r45, r45, 18199\n"
                      "{ v4int_h r13, r43, r45 ; fnop   }\n"
                      "move %0, r13\n"
                      "move %1, r43\n"
                      "move %2, r45\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
