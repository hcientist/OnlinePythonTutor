#include <stdlib.h>

typedef struct {
   int account_number;
   double balance;
   unsigned long moneys[5];
} Account;

int main() {
  Account my_account;
  my_account.account_number = 42;
  my_account.balance = 3.141592653589793238462643383279502884197169399375105820974944592307816406286;
  my_account.moneys[1] = 123;
  my_account.moneys[3] = 456;

  Account stack_accounts_array[4];
  stack_accounts_array[1].account_number = 1;
  stack_accounts_array[1].moneys[1] = 111111;
  stack_accounts_array[3].account_number = 3;
  stack_accounts_array[3].moneys[3] = 333333;

  Account* heap_accounts_array = malloc(5 * sizeof(*heap_accounts_array));
  heap_accounts_array[1].account_number = 1;
  heap_accounts_array[1].moneys[1] = 111111;
  heap_accounts_array[3].account_number = 3;
  heap_accounts_array[3].moneys[3] = 333333;
}
