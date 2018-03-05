//file: _insn_test_v4shru_X1.c
//op=329
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

unsigned long mem[2] = { 0xf942b109f0cbea25, 0x66bb2ebdeb23deb0 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r32, -17067\n"
                      "shl16insli r32, r32, 30779\n"
                      "shl16insli r32, r32, -22230\n"
                      "shl16insli r32, r32, -5615\n"
                      "moveli r50, -4121\n"
                      "shl16insli r50, r50, 16135\n"
                      "shl16insli r50, r50, -13858\n"
                      "shl16insli r50, r50, 4952\n"
                      "moveli r32, 12419\n"
                      "shl16insli r32, r32, -25174\n"
                      "shl16insli r32, r32, -23501\n"
                      "shl16insli r32, r32, 7961\n"
                      "{ fnop  ; v4shru r32, r50, r32  }\n"
                      "move %0, r32\n"
                      "move %1, r50\n"
                      "move %2, r32\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
