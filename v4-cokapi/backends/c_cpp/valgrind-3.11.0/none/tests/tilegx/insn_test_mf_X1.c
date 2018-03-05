//file: _insn_test_mf_X1.c
//op=150
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

unsigned long mem[2] = { 0x95953511f9ee4512, 0x52148e33ddfabfa8 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "{ fnop  ; mf   }\n"
                      );
    return 0;
}
