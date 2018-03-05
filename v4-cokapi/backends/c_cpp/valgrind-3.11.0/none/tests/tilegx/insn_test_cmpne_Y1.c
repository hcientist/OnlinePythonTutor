//file: _insn_test_cmpne_Y1.c
//op=63
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

unsigned long mem[2] = { 0x11b59d6276787136, 0x78c2286b07e86b55 };

int main(void) {
    unsigned long a[4] = { 0, 0 };
    asm __volatile__ (
                      "moveli r45, -19189\n"
                      "shl16insli r45, r45, 6578\n"
                      "shl16insli r45, r45, 17580\n"
                      "shl16insli r45, r45, 32436\n"
                      "moveli r36, -31697\n"
                      "shl16insli r36, r36, 8179\n"
                      "shl16insli r36, r36, -19147\n"
                      "shl16insli r36, r36, -16129\n"
                      "moveli r19, -12252\n"
                      "shl16insli r19, r19, 5860\n"
                      "shl16insli r19, r19, 15129\n"
                      "shl16insli r19, r19, -15375\n"
                      "{ fnop  ; cmpne r45, r36, r19 ; ld r63, r54  }\n"
                      "move %0, r45\n"
                      "move %1, r36\n"
                      "move %2, r19\n"
                      :"=r"(a[0]),"=r"(a[1]),"=r"(a[2]));
    printf("%016lx\n", a[0]);
    printf("%016lx\n", a[1]);
    printf("%016lx\n", a[2]);
    return 0;
}
